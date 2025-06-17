
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { ProdutoCreateSchema } from '@/schemas'; // Import from centralized schemas
import type { ProdutoAdmin } from '@/types'; // Still useful for mapping response

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personalizable = searchParams.get('personalizable');

    let query = supabaseServerClient
      .from('produtos')
      .select('*, categoria:categorias(nome)') // Fetch category name
      .order('nome', { ascending: true });

    if (personalizable === 'true') {
      query = query.eq('is_personalizable_pizza', true);
    } else if (personalizable === 'false') {
      query = query.or('is_personalizable_pizza.eq.false,is_personalizable_pizza.is.null');
    }

    const { data: dbData, error } = await query;
    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to ProdutoAdmin structure expected by frontend, including nome_categoria
    const responseData = dbData.map(item => {
      const { categoria, ...rest } = item as any; // Type assertion for processing
      const mappedItem: ProdutoAdmin = {
        ...rest,
        // @ts-ignore // Supabase relations might type 'categoria' as object or array
        nome_categoria: categoria?.nome || null,
        // @ts-ignore
        categoria_id: typeof categoria === 'object' && categoria !== null ? categoria.id : item.categoria_id,
      };
      return mappedItem;
    });

    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error('Erro interno no GET /admin/produtos:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = ProdutoCreateSchema.safeParse(json);

    if (!parsed.success) {
      console.error('Validação falhou:', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dataToInsert = parsed.data;
    
    // If it's a personalizable pizza and preco_base is undefined (as it should be from the form),
    // it will be omitted by JSON.stringify and handled by DB default or NULL.
    // The .refine rule in ProdutoCreateSchema ensures preco_base is present for non-pizzas.
    
    // Omit 'id' if present, as it's auto-generated
    const { id, ...payload } = dataToInsert;


    const { data: dbResult, error } = await supabaseServerClient
      .from('produtos')
      .insert(payload as any) // Cast to any to bypass potential strict type mismatch if id was part of 'payload' type
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir produto:', error);
      return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
    }
    
    // Map to ProdutoAdmin structure expected by frontend
    const { categoria_id, ...restOfDbResult } = dbResult;
    const responseProduct: Partial<ProdutoAdmin> = {
      ...restOfDbResult,
      categoria_id: typeof categoria_id === 'object' && categoria_id !== null ? (categoria_id as any).id : categoria_id,
      // nome_categoria would need another query or join if it's required immediately after POST
    };


    return NextResponse.json(responseProduct, { status: 201 });
  } catch (e: any) {
    console.error('Erro interno no POST /admin/produtos:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
