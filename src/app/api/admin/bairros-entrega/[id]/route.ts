
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { BairroEntregaUpdateSchema } from '@/schemas'; // Import from centralized schemas

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID do bairro é obrigatório.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseServerClient
      .from('bairros_entrega')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erro ao buscar bairro ${id}:`, error);
      if (error.code === 'PGRST116') { 
        return NextResponse.json({ error: `Bairro com ID ${id} não encontrado.` }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: `Bairro com ID ${id} não encontrado.` }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no GET de bairro_entrega por ID:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const routeId = params.id;
  if (!routeId) {
    return NextResponse.json({ error: 'ID do bairro é obrigatório na rota.' }, { status: 400 });
  }

  try {
    const json = await request.json();
    const dataToParse = { ...json, id: routeId };
    const parsedData = BairroEntregaUpdateSchema.safeParse(dataToParse);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }

    const { id, ...updatePayload } = parsedData.data;
    
    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'Nenhum dado fornecido para atualização.' }, { status: 400 });
    }

    const { data, error } = await supabaseServerClient
      .from('bairros_entrega')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar bairro ${id}:`, error);
       if (error.code === '23505') { 
        return NextResponse.json({ error: `Já existe um bairro com o nome fornecido.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: `Bairro com ID ${id} não encontrado.` }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no PUT de bairro_entrega:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID do bairro é obrigatório.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseServerClient
      .from('bairros_entrega')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar bairro ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: `Bairro ${id} deletado com sucesso.` }, { status: 200 });
  } catch (e) {
    console.error('Erro inesperado no DELETE de bairro_entrega:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
