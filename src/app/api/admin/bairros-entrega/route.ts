
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { BairroEntregaCreateSchema } from '@/schemas'; // Import from centralized schemas

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from('bairros_entrega')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar bairros de entrega:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no GET de bairros_entrega:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsedData = BairroEntregaCreateSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }

    const { id, ...payload } = parsedData.data as any;

    const { data: newBairro, error } = await supabaseServerClient
      .from('bairros_entrega')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar bairro de entrega:', error);
      if (error.code === '23505') { 
        return NextResponse.json({ error: `Já existe um bairro com o nome "${parsedData.data.nome}".` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(newBairro, { status: 201 });
  } catch (e) {
    console.error('Erro inesperado no POST de bairros_entrega:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
