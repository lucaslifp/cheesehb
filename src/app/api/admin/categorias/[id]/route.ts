
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { CategoriaUpdateSchema } from '@/schemas'; // Import from centralized schemas

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const routeId = params.id;
  if (!routeId) {
    return NextResponse.json({ error: 'ID da categoria é obrigatório na rota.' }, { status: 400 });
  }

  try {
    const json = await request.json();
    const dataToParse = { ...json, id: routeId };
    const parsedData = CategoriaUpdateSchema.safeParse(dataToParse);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }

    const { id, ...updatePayload } = parsedData.data;
    
    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'Nenhum dado fornecido para atualização.' }, { status: 400 });
    }

    const { data, error } = await supabaseServerClient
      .from('categorias')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar categoria ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: `Categoria com ID ${id} não encontrada.` }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no PUT de categoria:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID da categoria é obrigatório.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseServerClient
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar categoria ${id}:`, error);
      if (error.code === '23503') { 
        return NextResponse.json({ error: 'Não é possível excluir esta categoria pois ela está sendo usada por um ou mais produtos.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: `Categoria ${id} deletada com sucesso.` }, { status: 200 });
  } catch (e) {
    console.error('Erro inesperado no DELETE de categoria:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
