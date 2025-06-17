
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { BordaPizzaUpdateSchema } from '@/schemas'; 

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID da borda é obrigatório.' }, { status: 400 });
  }

  try {
    const { data: borda, error: bordaError } = await supabaseServerClient
      .from('bordas_pizza')
      .select('*') // Fetches preco_pequena and preco_grande directly
      .eq('id', id)
      .single();

    if (bordaError) {
      console.error(`Erro ao buscar borda de pizza ${id}:`, bordaError);
      if (bordaError.code === 'PGRST116') { 
        return NextResponse.json({ error: `Borda de pizza com ID ${id} não encontrada.` }, { status: 404 });
      }
      return NextResponse.json({ error: bordaError.message }, { status: 500 });
    }
    if (!borda) {
      return NextResponse.json({ error: `Borda de pizza com ID ${id} não encontrada.` }, { status: 404 });
    }

    return NextResponse.json(borda);

  } catch (e) {
    console.error('Erro inesperado no GET de borda_pizza por ID:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const routeId = params.id;
  if (!routeId) {
    return NextResponse.json({ error: 'ID da borda é obrigatório na rota.' }, { status: 400 });
  }

  try {
    const json = await request.json();
    const dataToParse = { ...json, id: routeId };
    const parsedData = BordaPizzaUpdateSchema.safeParse(dataToParse);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }

    const { id, ...bordaUpdatePayload } = parsedData.data; // preco_pequena and preco_grande are in bordaUpdatePayload
    
    if (Object.keys(bordaUpdatePayload).length === 0) {
        return NextResponse.json({ error: 'Nenhum dado fornecido para atualização.' }, { status: 400 });
    }

    const { data: updatedBordaData, error: bordaError } = await supabaseServerClient
      .from('bordas_pizza')
      .update(bordaUpdatePayload)
      .eq('id', id)
      .select()
      .single();

    if (bordaError) {
        console.error(`Erro ao atualizar borda de pizza ${id}:`, bordaError);
        if (bordaError.code === '23505') { 
            return NextResponse.json({ error: `Já existe uma borda de pizza com o nome fornecido.` }, { status: 409 });
        }
        return NextResponse.json({ error: bordaError.message }, { status: 500 });
    }
    
    if (!updatedBordaData) {
      return NextResponse.json({ error: `Borda com ID ${id} não encontrada.` }, { status: 404 });
    }

    return NextResponse.json(updatedBordaData);

  } catch (e) {
    console.error('Erro inesperado no PUT de borda_pizza:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID da borda é obrigatório.' }, { status: 400 });
  }

  try {
    // No need to delete from bordas_pizza_tamanhos anymore
    const { error: bordaDeleteError } = await supabaseServerClient
      .from('bordas_pizza')
      .delete()
      .eq('id', id);

    if (bordaDeleteError) {
      console.error(`Erro ao deletar borda de pizza ${id}:`, bordaDeleteError);
      return NextResponse.json({ error: bordaDeleteError.message }, { status: 500 });
    }
    return NextResponse.json({ message: `Borda de pizza ${id} deletada com sucesso.` }, { status: 200 });
  } catch (e) {
    console.error('Erro inesperado no DELETE de borda_pizza:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

