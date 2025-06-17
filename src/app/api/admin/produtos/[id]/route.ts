
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { ProdutoUpdateSchema } from '@/schemas'; // Import from centralized schemas
import type { ProdutoAdmin } from '@/types'; // Still useful for mapping response

// GET by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID não fornecido.' }, { status: 400 });
  }
  try {
    const { data: dbData, error } = await supabaseServerClient
      .from('produtos')
      .select('*, categoria:categorias(id, nome)') // Fetch category id and name
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar produto:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: `Produto com ID ${id} não encontrado.` }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!dbData) {
        return NextResponse.json({ error: `Produto com ID ${id} não encontrado.` }, { status: 404 });
    }
    
    const { categoria, ...rest } = dbData as any; 
    const responseData: ProdutoAdmin = {
      ...rest,
      // @ts-ignore
      nome_categoria: categoria?.nome || null,
      // @ts-ignore
      categoria_id: categoria?.id || null,
    };

    return NextResponse.json(responseData);
  } catch (e: any) {
    console.error('Erro interno no GET /admin/produtos/[id]:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// UPDATE by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const routeParamsId = params.id; 
  if (!routeParamsId) {
    return NextResponse.json({ error: 'ID não fornecido na rota.' }, { status: 400 });
  }
  try {
    const json = await request.json();
    // Add the id from route params to the JSON body for validation consistency with ProdutoUpdateSchema
    const dataToParse = { ...json, id: routeParamsId };
    const parsed = ProdutoUpdateSchema.safeParse(dataToParse);

    if (!parsed.success) {
      console.error('Validação falhou:', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Dados inválidos.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    
    const { id, ...updateData } = parsed.data; // Destructure validated id

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum campo de dados fornecido para atualização.' }, { status: 200 });
    }
    
    const dbPayload: any = { ...updateData, updated_at: new Date().toISOString() };

    // If it's a personalizable pizza and preco_base is explicitly set to undefined or null,
    // it means we want to ensure it's null in the DB.
    // If it's NOT a personalizable pizza, preco_base is required by the refine rule.
    if (updateData.is_personalizable_pizza && updateData.preco_base === undefined) {
        dbPayload.preco_base = null; // Explicitly set to null if undefined for personalizable pizza
    }


    const { data: updatedProduct, error } = await supabaseServerClient
      .from('produtos')
      .update(dbPayload)
      .eq('id', id) // Use validated id from parsed.data
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      if (error.code === 'PGRST116') { 
        return NextResponse.json({ error: `Produto com ID ${id} não encontrado para atualização.` }, { status: 404 });
      }
      return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
    }
    if (!updatedProduct) {
         return NextResponse.json({ error: `Produto com ID ${id} não encontrado após a tentativa de atualização.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (e: any) {
    console.error('Erro interno no PUT /admin/produtos/[id]:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// DELETE by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'ID não fornecido.' }, { status: 400 });
  }
  try {
    const { data: existingProduct, error: fetchError } = await supabaseServerClient
        .from('produtos')
        .select('id')
        .eq('id', id)
        .maybeSingle();

    if (fetchError) {
        console.error(`Erro ao verificar produto ${id} antes de deletar:`, fetchError);
        return NextResponse.json({ error: 'Erro ao verificar produto antes de excluir.', details: fetchError.message }, { status: 500});
    }
    if (!existingProduct) {
        return NextResponse.json({ error: `Produto com ID ${id} não encontrado.`}, { status: 404 });
    }
    
    const { error } = await supabaseServerClient
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar produto:', error);
      if (error.code === '23503') { 
            return NextResponse.json({ error: 'Não é possível excluir este produto pois ele está referenciado em outros registros (ex: itens de pedido).', details: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: `Produto ${id} excluído com sucesso.` });
  } catch (e: any) {
    console.error('Erro interno no DELETE /admin/produtos/[id]:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
