
// src/app/api/admin/pizzas/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseServerClient as supabase } from '@/lib/supabaseServerClient';

// Schema for creating a new Pizza Base.
const PizzaCreateSchema = z.object({
  nome: z.string().min(1, "Nome da pizza base é obrigatório."),
  preco: z.number().min(0, "Preço deve ser zero ou positivo."),
  imagem_url: z.string().url("URL da imagem inválida.").optional().nullable(),
  tamanho_pizza: z.enum(['pequena', 'grande'], { required_error: "Tamanho da pizza é obrigatório."}),
  tipo_pizza: z.enum(['salgada', 'doce'], { required_error: "Tipo da pizza (salgada/doce) é obrigatório."}),
  no_cardapio: z.boolean().default(true).optional(),
  status: z.boolean().default(true).optional(),
});

// Schema for updating an existing Pizza Base.
const PizzaUpdateSchema = PizzaCreateSchema.partial().extend({
  id: z.string().uuid("ID inválido."),
});


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = PizzaCreateSchema.safeParse(body);

    if (!parseResult.success) {
      console.error("API /admin/pizzas POST - Zod validation failed:", parseResult.error.flatten());
      return NextResponse.json({ error: 'Dados inválidos para criar pizza base.', details: parseResult.error.flatten() }, { status: 400 });
    }

    const pizzaDataToInsert = {
      ...parseResult.data,
      no_cardapio: parseResult.data.no_cardapio ?? true,
      status: parseResult.data.status ?? true,
    };

    const { data, error } = await supabase
      .from('pizzas')
      .insert(pizzaDataToInsert)
      .select()
      .single();

    if (error) {
      console.error("API /admin/pizzas POST - Erro ao inserir no Supabase:", error);
      const errorMessage = error.message || "Erro desconhecido do Supabase.";
      if (error.code === '23505') {
        return NextResponse.json({ error: `Já existe uma pizza base com o nome "${parseResult.data.nome}" ou outro conflito de unicidade.`, details: errorMessage }, { status: 409 });
      }
      if (errorMessage.includes("relation \"public.pizzas\" does not exist")) {
        console.error("CRITICAL: A tabela 'pizzas' parece não existir no banco de dados.");
        return NextResponse.json({ error: "Erro de configuração do banco: Tabela 'pizzas' não encontrada.", details: errorMessage }, { status: 500 });
      }
      return NextResponse.json({ error: 'Erro ao inserir pizza base no banco de dados.', details: errorMessage }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('API /admin/pizzas POST - Erro interno:', err);
    const details = err.message || "Detalhes do erro não disponíveis.";
    return NextResponse.json({ error: 'Erro interno do servidor.', details: details }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pizzas')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error("API /admin/pizzas GET - Erro ao buscar pizzas:", error);
      const errorMessage = error.message || "Erro desconhecido do Supabase.";
      if (errorMessage.includes("relation \"public.pizzas\" does not exist")) {
        console.error("CRITICAL: A tabela 'pizzas' parece não existir no banco de dados.");
        return NextResponse.json({ error: "Erro de configuração do banco: Tabela 'pizzas' não encontrada.", details: errorMessage }, { status: 500 });
      }
      return NextResponse.json({ error: 'Erro ao buscar pizzas.', details: errorMessage }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('API /admin/pizzas GET - Erro interno:', err);
    const details = err.message || "Detalhes do erro não disponíveis.";
    return NextResponse.json({ error: 'Erro interno do servidor.', details: details }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = PizzaUpdateSchema.extend({id: z.string().uuid()}).safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Dados inválidos para atualizar pizza base.', details: parseResult.error.flatten() }, { status: 400 });
    }

    const { id, ...updateData } = parseResult.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum dado fornecido para atualização.'}, {status: 400});
    }
    
    const finalUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pizzas')
      .update(finalUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`API /admin/pizzas PUT - Erro ao atualizar pizza ${id}:`, error);
      const errorMessage = error.message || "Erro desconhecido do Supabase.";
      if (error.code === 'PGRST116') { 
        return NextResponse.json({ error: `Pizza base com ID ${id} não encontrada.`, details: errorMessage}, { status: 404 });
      }
      return NextResponse.json({ error: 'Erro ao atualizar pizza base.', details: errorMessage }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('API /admin/pizzas PUT - Erro interno:', err);
    const details = err.message || "Detalhes do erro não disponíveis.";
    return NextResponse.json({ error: 'Erro interno do servidor.', details: details }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'ID da pizza base inválido ou não fornecido.' }, { status: 400 });
    }

    const { data: existingPizza, error: fetchError } = await supabase
      .from('pizzas')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error(`API /admin/pizzas DELETE - Erro ao verificar pizza ${id}:`, fetchError);
      const errorMessage = fetchError.message || "Erro desconhecido ao verificar pizza.";
      return NextResponse.json({ error: "Erro ao verificar pizza antes de excluir.", details: errorMessage }, { status: 500});
    }
    if (!existingPizza) {
      return NextResponse.json({ error: `Pizza base com ID ${id} não encontrada.`}, { status: 404 });
    }
    
    const { error: deleteError } = await supabase
      .from('pizzas')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error(`API /admin/pizzas DELETE - Erro ao deletar pizza ${id}:`, deleteError);
      const errorMessage = deleteError.message || "Erro desconhecido ao deletar pizza.";
       if (deleteError.code === '23503') {
        return NextResponse.json({ error: 'Não é possível excluir esta pizza base pois ela está referenciada em outros registros.', details: errorMessage }, { status: 409 });
      }
      return NextResponse.json({ error: 'Erro ao deletar pizza base.', details: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ message: `Pizza base ${id} excluída com sucesso.` }, { status: 200 });
  } catch (err:any) {
    console.error('API /admin/pizzas DELETE - Erro interno:', err);
    const details = err.message || "Detalhes do erro não disponíveis.";
    return NextResponse.json({ error: 'Erro interno do servidor.', details: details }, { status: 500 });
  }
}

