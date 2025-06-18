// src/app/api/admin/pizzas/route.ts

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data, error } = await supabaseServerClient
    .from("pizzas_personalizaveis")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Erro ao buscar pizzas." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const {
    nome,
    descricao,
    imagem_url,
    categoria_id,
    ativo,
    mostrar_no_cardapio,
    tamanho_pizza,
    tipo_pizza,
    titulo_modal_personalizacao,
  } = body;

  const { data, error } = await supabaseServerClient
    .from("pizzas_personalizaveis")
    .insert([
      {
        nome,
        descricao,
        imagem_url,
        categoria_id,
        ativo,
        mostrar_no_cardapio,
        tamanho_pizza,
        tipo_pizza,
        titulo_modal_personalizacao,
      },
    ])
    .select();

  if (error) {
    return NextResponse.json(
      { error: "Erro ao cadastrar pizza." },
      { status: 500 }
    );
  }

  return NextResponse.json(data[0]);
}
