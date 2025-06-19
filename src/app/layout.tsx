/* ------------------------------------------------------------------
 *  src/app/layout.tsx   –   mock-dev com preço mínimo calculado
 * ----------------------------------------------------------------*/
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import type {
  SaborPizza,
  Borda,
  BairroEntrega,
  AdicionalPizza,
  ProdutoAdmin,
  CategoriaAdmin,
  GrupoOpcional,
  ItemOpcional,
} from "@/types";
import type { ReactNode } from "react";

/* --------------------------------------------------------------- */
export const metadata: Metadata = {
  title: "CheesePizza",
  description: "Peça sua pizza favorita com sugestões feitas por IA!",
};

/* ----------------------------------------------------------------
 *  MOCKS – mesmos que você já usava
 * ----------------------------------------------------------------*/
function getMockSaboresPizza(): SaborPizza[] {
  return [
    {
      id: "sabor1",
      nome: "Calabresa (Mock)",
      preco_grande: 40,
      preco_pequena: 25,
      categoria_sabor: "salgada",
      ativo: true,
    },
    {
      id: "sabor2",
      nome: "Chocolate (Mock)",
      preco_grande: 42,
      preco_pequena: 27,
      categoria_sabor: "doce",
      ativo: true,
    },
  ];
}

function getMockBordasPizza(): Borda[] {
  return [
    {
      id: "borda_catupiry",
      nome: "Recheada Catupiry",
      preco_pequena: 8,
      preco_grande: 12,
      ativo: true,
      created_at: "" as any,
    },
  ];
}

function getMockAdicionaisPizza(): AdicionalPizza[] {
  return [{ id: "ad_bacon", nome: "Bacon extra", preco: 5, ativo: true }];
}

function getMockBairrosEntrega(): BairroEntrega[] {
  return [
    {
      id: "b1",
      nome: "Centro",
      taxa_entrega: 5,
      tempo_estimado_entrega_minutos: 30,
      ativo: true,
    },
  ];
}

function getMockCategorias(): CategoriaAdmin[] {
  return [
    {
      id: "cat_bebidas",
      nome: "Bebidas",
      ordem: 10,
      mostrar_nos_filtros_homepage: true,
    },
    {
      id: "cat_pizzas_base",
      nome: "Pizzas (para montar)",
      ordem: 5,
      mostrar_nos_filtros_homepage: false,
    },
  ];
}

function getMockProdutos(): ProdutoAdmin[] {
  const cats = getMockCategorias();
  const catPizzaBase = cats.find((c) => c.nome.includes("para montar"))!.id;
  const catBebidas = cats.find((c) => c.nome === "Bebidas")!.id;

  /* exemplo de grupo opcional mock só para ilustrar  */
  const gruposMock: GrupoOpcional[] = [
    {
      id: "grupo_refri",
      nome: "Refrigerante",
      tipo_selecao: "RADIO_OBRIGATORIO",
      ordem: 1,
      ativo: true,
      itens: [
        {
          id: "opt_coca",
          nome: "Coca lata",
          preco_adicional: 0,
          ativo: true,
          ordem: 1,
        } as ItemOpcional,
      ],
    },
  ];

  return [
    /* Pizza grande personalizável */
    {
      id: "pizza_grande",
      nome: "Pizza Grande 2 Sabores",
      descricao: "Monte sua pizza grande (8 fatias)",
      preco_base: null,
      categoria_id: catPizzaBase,
      ativo: true,
      mostrar_no_cardapio: true,
      is_personalizable_pizza: true,
      available_sizes: ["grande"],
      imagem_url: "https://placehold.co/300x200.png",
      image_hint: "",
    } as unknown as ProdutoAdmin,

    /* Bebida simples */
    {
      id: "bebida_coca",
      nome: "Coca-Cola Lata",
      descricao: "350 ml",
      preco_base: 6,
      categoria_id: catBebidas,
      ativo: true,
      mostrar_no_cardapio: true,
      is_personalizable_pizza: false,
      imagem_url: "https://placehold.co/300x200.png",
      image_hint: "",
    } as unknown as ProdutoAdmin,

    /* Hamburguer com opcionais */
    {
      id: "burguer1",
      nome: "X-Burger Clássico",
      descricao: "Carne, queijo, salada",
      preco_base: 25,
      categoria_id: "cat_burgers",
      ativo: true,
      mostrar_no_cardapio: true,
      is_personalizable_pizza: false,
      grupos_opcionais_ids: ["grupo_refri"],
      gruposDeOpcionais: gruposMock,
      imagem_url: "https://placehold.co/300x200.png",
      image_hint: "",
    } as unknown as ProdutoAdmin,
  ];
}

/* ----------------------------------------------------------------
 *   Enriquecimento de preço mínimo para pizzas personalizáveis
 * ----------------------------------------------------------------*/
function enrichProdutosComPrecoMinimo(
  lista: ProdutoAdmin[] | undefined,
  sabores: SaborPizza[]
): ProdutoAdmin[] {
  if (!Array.isArray(lista)) return [];

  return lista.map((p) => {
    if (!p.is_personalizable_pizza) return p;

    const usaGrande = p.available_sizes?.includes("grande");
    const usaPequena = p.available_sizes?.includes("pequena");

    let menor = Number.POSITIVE_INFINITY;
    sabores
      .filter((s) => s.ativo)
      .forEach((s) => {
        if (usaGrande && s.preco_grande < menor) menor = s.preco_grande;
        if (usaPequena && s.preco_pequena < menor) menor = s.preco_pequena;
      });

    const preco_base_final =
      Number.isFinite(menor) && menor > 0 ? menor : p.preco_base ?? 0;

    return { ...p, preco_base: preco_base_final };
  });
}

/* ----------------------------------------------------------------
 *  RootLayout
 * ----------------------------------------------------------------*/
export default function RootLayout({ children }: { children: ReactNode }) {
  const sabores = getMockSaboresPizza();
  const bordas = getMockBordasPizza();
  const adicionais = getMockAdicionaisPizza();
  const bairros = getMockBairrosEntrega();
  const categorias = getMockCategorias();

  const produtos = enrichProdutosComPrecoMinimo(getMockProdutos(), sabores);

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <CartProvider
          initialSabores={sabores}
          initialBordas={bordas}
          initialAdicionais={adicionais}
          initialBairros={bairros}
          initialProdutos={produtos}
          initialCategorias={categorias}
        >
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
