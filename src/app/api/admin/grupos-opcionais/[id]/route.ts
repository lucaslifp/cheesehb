
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient as supabase } from '@/lib/supabaseServerClient';
import { z } from 'zod';

const ItemOpcionalUpdateSchema = z.object({
  id: z.string().uuid().optional(), // ID é opcional, pode ser um novo item
  nome: z.string().min(1, "Nome do item é obrigatório."),
  preco_adicional: z.coerce.number().min(0, "Preço adicional deve ser zero ou positivo."),
  produto_original_id: z.string().uuid().optional().nullable(),
  default_selecionado: z.boolean().default(false),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true),
});

const GrupoOpcionalUpdateSchema = z.object({
  nome: z.string().min(1, "Nome do grupo é obrigatório.").optional(),
  tipo_selecao: z.enum(['RADIO_OBRIGATORIO', 'CHECKBOX_OPCIONAL_MULTI', 'CHECKBOX_OBRIGATORIO_MULTI']).optional(),
  min_selecoes: z.coerce.number().int().optional().nullable(),
  max_selecoes: z.coerce.number().int().optional().nullable(),
  instrucao: z.string().optional().nullable(),
  ordem: z.number().int().default(0).optional(),
  ativo: z.boolean().default(true).optional(),
  itens: z.array(ItemOpcionalUpdateSchema).optional(), // Itens são opcionais na atualização do grupo em si
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'ID do grupo opcional é obrigatório.' }, { status: 400 });
  }

  try {
    const { data: grupo, error } = await supabase
      .from('grupos_opcionais')
      .select(`
        *,
        itens_opcionais (
          *
        )
      `)
      .eq('id', id)
      .order('ordem', { foreignTable: 'itens_opcionais', ascending: true })
      .single();

    if (error) {
      console.error(`Erro ao buscar grupo opcional ${id}:`, error);
      if (error.code === 'PGRST116') { 
        return NextResponse.json({ error: `Grupo opcional com ID ${id} não encontrado.` }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!grupo) {
      return NextResponse.json({ error: `Grupo opcional com ID ${id} não encontrado.` }, { status: 404 });
    }
    return NextResponse.json(grupo);
  } catch (e) {
    console.error('Erro inesperado no GET de grupo_opcional por ID:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const grupoId = params.id;
  if (!grupoId) {
    return NextResponse.json({ error: 'ID do grupo opcional é obrigatório.' }, { status: 400 });
  }

  try {
    const json = await request.json();
    const parsedData = GrupoOpcionalUpdateSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }
    
    const { itens, ...grupoUpdateData } = parsedData.data;

    // 1. Atualizar dados do grupo (se houver)
    if (Object.keys(grupoUpdateData).length > 0) {
        const { data: updatedGrupo, error: grupoError } = await supabase
        .from('grupos_opcionais')
        .update(grupoUpdateData)
        .eq('id', grupoId)
        .select()
        .single();

        if (grupoError) {
            console.error(`Erro ao atualizar grupo opcional ${grupoId}:`, grupoError);
            if (grupoError.code === '23505') { // unique constraint violation
                return NextResponse.json({ error: `Já existe um grupo opcional com o nome fornecido.` }, { status: 409 });
            }
            return NextResponse.json({ error: grupoError.message }, { status: 500 });
        }
        if (!updatedGrupo) {
            return NextResponse.json({ error: `Grupo opcional com ID ${grupoId} não encontrado para atualização.` }, { status: 404 });
        }
    }
    
    // 2. Atualizar/Criar/Deletar itens (estratégia: deletar todos os antigos e recriar)
    if (itens !== undefined) { // Só mexe nos itens se o array 'itens' for explicitamente passado
      // Deletar itens existentes para este grupo
      const { error: deleteError } = await supabase
        .from('itens_opcionais')
        .delete()
        .eq('grupo_opcional_id', grupoId);

      if (deleteError) {
        console.error(`Erro ao deletar itens antigos do grupo ${grupoId}:`, deleteError);
        return NextResponse.json({ error: `Falha ao limpar itens antigos: ${deleteError.message}` }, { status: 500 });
      }

      // Inserir novos itens (se houver)
      if (itens.length > 0) {
        const itensParaInserir = itens.map(item => ({
          ...item,
          grupo_opcional_id: grupoId,
          id: undefined, // Garantir que novos UUIDs sejam gerados para os itens
        }));

        const { error: insertError } = await supabase
          .from('itens_opcionais')
          .insert(itensParaInserir);

        if (insertError) {
          console.error(`Erro ao inserir novos itens para o grupo ${grupoId}:`, insertError);
          return NextResponse.json({ error: `Falha ao inserir novos itens: ${insertError.message}` }, { status: 500 });
        }
      }
    }

    // Retornar o grupo atualizado com seus itens
    const { data: grupoComItens, error: fetchError } = await supabase
      .from('grupos_opcionais')
      .select('*, itens_opcionais(*)')
      .eq('id', grupoId)
      .single();

    if (fetchError || !grupoComItens) {
      console.error(`Erro ao buscar grupo atualizado ${grupoId} com itens:`, fetchError);
      return NextResponse.json({ error: 'Grupo atualizado, mas falha ao retornar os dados completos.'}, { status: 207 }); // Multi-Status
    }
    
    return NextResponse.json(grupoComItens);

  } catch (e) {
    console.error('Erro inesperado no PUT de grupo_opcional:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'ID do grupo opcional é obrigatório.' }, { status: 400 });
  }

  try {
    // Itens opcionais serão deletados em cascata devido ao ON DELETE CASCADE na FK
    const { error } = await supabase
      .from('grupos_opcionais')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar grupo opcional ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: `Grupo opcional ${id} e seus itens foram deletados com sucesso.` }, { status: 200 });
  } catch (e) {
    console.error('Erro inesperado no DELETE de grupo_opcional:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
