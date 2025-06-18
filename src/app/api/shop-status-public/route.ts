import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET() {
  const CONFIG_ID = "00000000-0000-0000-0000-000000000001";

  const { data: config, error: configError } = await supabaseServerClient
    .from("loja_configuracoes")
    .select(
      "override_status, mensagem_loja_fechada_personalizada, horarios_funcionamento, nome_loja, endereco_loja, whatsapp_loja, instagram_loja, logo_url"
    )
    .eq("id", CONFIG_ID)
    .single();

  const { data: produtos, error: produtosError } = await supabaseServerClient
    .from("produtos")
    .select("*, categoria_id")
    .eq("ativo", true)
    .eq("mostrar_no_cardapio", true);

  const { data: categorias, error: categoriasError } =
    await supabaseServerClient
      .from("categorias")
      .select("id, mostrar_nos_filtros_homepage, nome, direto_no_carrinho");

  if (configError || produtosError || categoriasError) {
    return NextResponse.json(
      { erro: "Erro ao carregar dados." },
      { status: 500 }
    );
  }

  const produtosComExtras = (produtos || []).map((p) => {
    const categoria = categorias?.find((c) => c.id === p.categoria_id);
    return {
      ...p,
      preco: p.preco_base ?? 0,
      diretoNoCarrinho: categoria?.direto_no_carrinho ?? false,
    };
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
    produtos: produtosComExtras,
  });
}
