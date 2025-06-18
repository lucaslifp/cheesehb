
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { SaborPizzaUpdateSchema } from '@/schemas'; // Import from centralized schemas

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID do sabor é obrigatório.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseServerClient
      .from('sabores_pizza')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erro ao buscar sabor de pizza ${id}:`, error);
      if (error.code === 'PGRST116') { 
        return NextResponse.json({ error: `Sabor de pizza com ID ${id} não encontrado.` }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: `Sabor de pizza com ID ${id} não encontrado.` }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no GET de sabor_pizza por ID:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const routeId = params.id;
  if (!routeId) {
    return NextResponse.json({ error: 'ID do sabor é obrigatório na rota.' }, { status: 400 });
  }

  try {
    const json = await request.json();
    const dataToParse = { ...json, id: routeId }; // Add route id for schema validation
    const parsedData = SaborPizzaUpdateSchema.safeParse(dataToParse);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }

    const { id, ...updatePayload } = parsedData.data; // Destructure validated id
    
    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'Nenhum dado fornecido para atualização.' }, { status: 400 });
    }

    const { data, error } = await supabaseServerClient
      .from('sabores_pizza')
      .update(updatePayload)
      .eq('id', id) // Use validated id
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar sabor de pizza ${id}:`, error);
       if (error.code === '23505') { 
        return NextResponse.json({ error: `Já existe um sabor de pizza com o nome fornecido.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: `Sabor de pizza com ID ${id} não encontrado.` }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no PUT de sabor_pizza:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID do sabor é obrigatório.' }, { status: 400 });
  }

  try {
    const { error } = await supabaseServerClient
      .from('sabores_pizza')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar sabor de pizza ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: `Sabor de pizza ${id} deletado com sucesso.` }, { status: 200 });
  } catch (e) {
    console.error('Erro inesperado no DELETE de sabor_pizza:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
