// -------------  PUBLIC SHOP STATUS  -----------------
import { NextResponse } from "next/server";
import { supabaseServerClient as supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

  /* ───── loja_configuracoes ───── */
  const { data: config, error: cfgErr } = await supabase
    .from("loja_configuracoes")
    .select(
      "override_status, mensagem_loja_fechada_personalizada, horarios_funcionamento, nome_loja, endereco_loja, whatsapp_loja, instagram_loja, logo_url"
    )
    .eq("id", CONFIG_ID)
    .single();

  /* ───── produtos ───── */
  const { data: produtos, error: prodErr } = await supabase
    .from("produtos")
    .select("* , categoria_id")
    .eq("ativo", true)
    .eq("mostrar_no_cardapio", true);

  /* ───── categorias (para flag direto_no_carrinho) ───── */
  const { data: categorias, error: catErr } = await supabase
    .from("categorias")
    .select("id, direto_no_carrinho");

  /* ───── NOVO: adicionais genéricos ───── */
  const { data: adicionais, error: addErr } = await supabase
    .from("adicionais")
    .select("id, nome, preco, ativo")
    .eq("ativo", true);

  if (cfgErr || prodErr || catErr || addErr) {
    const err = cfgErr ?? prodErr ?? catErr ?? addErr;
    console.error("shop-status-public error:", err);
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }

  /* anexa flag → produto */
  const produtosComFlag = (produtos ?? []).map((p) => {
    const cat = categorias?.find((c) => c.id === p.categoria_id);
    return { ...p, direto_no_carrinho: cat?.direto_no_carrinho ?? false };
  });

  return NextResponse.json({
    overrideStatus: config?.override_status,
    shopClosedMessage: config?.mensagem_loja_fechada_personalizada,
    horariosFuncionamento: config?.horarios_funcionamento || [],
    nomeLoja: config?.nome_loja,
    enderecoLoja: config?.endereco_loja,
    whatsappLoja: config?.whatsapp_loja,
    instagramLoja: config?.instagram_loja,
    logoUrl: config?.logo_url,
    produtos: produtosComFlag,
    adicionais, //  ← NOVO
  });
}
