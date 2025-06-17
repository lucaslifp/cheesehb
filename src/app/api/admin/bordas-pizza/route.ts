
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { BordaPizzaCreateSchema } from '@/schemas'; 

export async function GET() {
  try {
    // Now, preco_pequena and preco_grande are directly in bordas_pizza table
    const { data: bordas, error: bordasError } = await supabaseServerClient
      .from('bordas_pizza')
      .select('*') // This should select preco_pequena and preco_grande as well
      .order('nome', { ascending: true });

    if (bordasError) {
      console.error('Erro ao buscar bordas de pizza:', bordasError);
      return NextResponse.json({ error: bordasError.message }, { status: 500 });
    }
    
    return NextResponse.json(bordas || []);

  } catch (e) {
    console.error('Erro inesperado no GET de bordas_pizza:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsedData = BordaPizzaCreateSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }
    
    // preco_pequena and preco_grande are now part of bordaPayload directly
    const bordaPayload = parsedData.data;

    // Insert into bordas_pizza, including preco_pequena and preco_grande
    const { data: newBorda, error: bordaError } = await supabaseServerClient
      .from('bordas_pizza')
      .insert(bordaPayload)
      .select()
      .single();

    if (bordaError) {
      console.error('Erro ao criar borda de pizza:', bordaError);
      if (bordaError.code === '23505') { 
        return NextResponse.json({ error: `Já existe uma borda de pizza com o nome "${parsedData.data.nome}".` }, { status: 409 });
      }
      return NextResponse.json({ error: bordaError.message }, { status: 500 });
    }

    if (!newBorda) {
        return NextResponse.json({ error: 'Falha ao criar borda, dados não retornados.' }, { status: 500 });
    }
    
    return NextResponse.json(newBorda, { status: 201 });

  } catch (e) {
    console.error('Erro inesperado no POST de bordas_pizza:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

