
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { CategoriaCreateSchema } from '@/schemas'; // Import from centralized schemas

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from('categorias')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Erro inesperado no GET de categorias:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsedData = CategoriaCreateSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }

    const { id, ...payload } = parsedData.data as any;

    const { data, error } = await supabaseServerClient
      .from('categorias')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('Erro inesperado no POST de categorias:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
