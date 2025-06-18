
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { SaborPizzaCreateSchema } from '@/schemas'; // Import from centralized schemas

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from('sabores_pizza')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar sabores de pizza:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no GET de sabores_pizza:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsedData = SaborPizzaCreateSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }
    
    // Omit 'id' if present, as it's auto-generated
    const { id, ...payload } = parsedData.data as any;


    const { data: newSabor, error } = await supabaseServerClient
      .from('sabores_pizza')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar sabor de pizza:', error);
      if (error.code === '23505') { 
        return NextResponse.json({ error: `Já existe um sabor de pizza com o nome "${parsedData.data.nome}".` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(newSabor, { status: 201 });
  } catch (e) {
    console.error('Erro inesperado no POST de sabores_pizza:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
