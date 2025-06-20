import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient as supabase } from "@/lib/supabaseServerClient";

// ➤ GET: listar adicionais
export async function GET() {
  const { data, error } = await supabase
    .from("adicionais")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// ➤ POST: adicionar novo adicional
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, preco } = body;

    if (!nome || typeof preco !== "number") {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("adicionais").insert({ nome, preco });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao cadastrar adicional." },
      { status: 500 }
    );
  }
}
