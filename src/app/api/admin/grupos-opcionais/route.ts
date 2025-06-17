
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient as supabase } from '@/lib/supabaseServerClient';
import { z } from 'zod';
import type { ItemOpcional, TipoSelecaoGrupo } from '@/types';

const ItemOpcionalCreateSchema = z.object({
  id: z.string().uuid().optional(), // Opcional para novos itens
  nome: z.string().min(1, "Nome do item é obrigatório."),
  preco_adicional: z.coerce.number().min(0, "Preço adicional deve ser zero ou positivo."),
  produto_original_id: z.string().uuid().optional().nullable(),
  default_selecionado: z.boolean().default(false),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true),
});

const GrupoOpcionalCreateSchema = z.object({
  nome: z.string().min(1, "Nome do grupo é obrigatório."),
  tipo_selecao: z.enum(['RADIO_OBRIGATORIO', 'CHECKBOX_OPCIONAL_MULTI', 'CHECKBOX_OBRIGATORIO_MULTI']),
  min_selecoes: z.coerce.number().int().optional().nullable(),
  max_selecoes: z.coerce.number().int().optional().nullable(),
  instrucao: z.string().optional().nullable(),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true),
  itens: z.array(ItemOpcionalCreateSchema).min(1, "O grupo deve ter pelo menos um item."),
});


export async function GET() {
  try {
    const { data: grupos, error: gruposError } = await supabase
      .from('grupos_opcionais')
      .select(`
        *,
        itens_opcionais (
          *
        )
      `)
      .order('ordem', { ascending: true })
      .order('ordem', { foreignTable: 'itens_opcionais', ascending: true });

    if (gruposError) {
      console.error('Erro ao buscar grupos opcionais:', gruposError);
      return NextResponse.json({ error: gruposError.message }, { status: 500 });
    }

    return NextResponse.json(grupos);
  } catch (e) {
    console.error('Erro inesperado no GET de grupos_opcionais:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsedData = GrupoOpcionalCreateSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos para o grupo.', details: parsedData.error.flatten() }, { status: 400 });
    }

    const { itens, ...grupoData } = parsedData.data;

    // 1. Criar o grupo
    const { data: newGrupo, error: grupoError } = await supabase
      .from('grupos_opcionais')
      .insert(grupoData)
      .select()
      .single();

    if (grupoError) {
      console.error('Erro ao criar grupo opcional:', grupoError);
      if (grupoError.code === '23505') { // unique constraint violation
        return NextResponse.json({ error: `Já existe um grupo opcional com o nome "${grupoData.nome}".` }, { status: 409 });
      }
      return NextResponse.json({ error: grupoError.message }, { status: 500 });
    }

    if (!newGrupo) {
      return NextResponse.json({ error: 'Falha ao criar o grupo, não retornou dados.' }, { status: 500 });
    }

    // 2. Criar os itens associados ao grupo
    const itensParaInserir = itens.map(item => ({
      ...item,
      grupo_opcional_id: newGrupo.id,
    }));

    const { data: newItens, error: itensError } = await supabase
      .from('itens_opcionais')
      .insert(itensParaInserir)
      .select();

    if (itensError) {
      console.error('Erro ao criar itens opcionais (após criar grupo):', itensError);
      // Tentar deletar o grupo criado para consistência (rollback manual)
      await supabase.from('grupos_opcionais').delete().eq('id', newGrupo.id);
      return NextResponse.json({ error: `Falha ao criar itens do grupo: ${itensError.message}. O grupo foi removido.` }, { status: 500 });
    }

    return NextResponse.json({ ...newGrupo, itens: newItens || [] }, { status: 201 });

  } catch (e) {
    console.error('Erro inesperado no POST de grupos_opcionais:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
