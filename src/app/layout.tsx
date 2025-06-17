
import type { Metadata }
from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from '@/context/CartContext';
import type { SaborPizza, Borda, BairroEntrega, AdicionalPizza, ProdutoAdmin, CategoriaAdmin, GrupoOpcional, ItemOpcional, TipoSelecaoGrupo } from '@/types';
import type { ReactNode } from 'react';
// import { supabaseServerClient } from '@/lib/supabaseServerClient'; // Changed from supabase

export const metadata: Metadata = {
  title: 'CheesePizza',
  description: 'Peça sua pizza favorita com sugestões feitas por IA!',
};

// Mock data functions
function getMockSaboresPizza(): SaborPizza[] {
  return [
    { id: 'sabor1', nome: 'Calabresa (Mock)', preco_grande: 40, preco_pequena: 25, categoria_sabor: 'Salgada', ativo: true },
    { id: 'sabor2', nome: 'Mussarela (Mock)', preco_grande: 38, preco_pequena: 23, categoria_sabor: 'Salgada', ativo: true },
    { id: 'sabor3', nome: 'Chocolate (Mock)', preco_grande: 42, preco_pequena: 27, categoria_sabor: 'Doce', ativo: true },
  ];
}

function getMockBordasPizza(): Borda[] {
  return [
    { id: 'borda1', nome: 'Catupiry (Mock)', preco_adicional: 8, ativo: true },
    { id: 'borda2', nome: 'Cheddar (Mock)', preco_adicional: 7, ativo: true },
    { id: 'borda-nenhuma', nome: 'Não quero borda', preco_adicional: 0, ativo: true },
  ];
}

function getMockAdicionaisPizza(): AdicionalPizza[] {
  return [
    { id: 'adicional1', nome: 'Bacon Extra (Mock)', preco: 5, ativo: true },
    { id: 'adicional2', nome: 'Milho (Mock)', preco: 3, ativo: true },
  ];
}

function getMockBairrosEntrega(): BairroEntrega[] {
  return [
    { id: 'bairro1', nome: 'Centro (Mock)', taxa_entrega: 5, ativo: true, tempo_estimado_entrega_minutos: 30 },
    { id: 'bairro2', nome: 'Vila Pizzaiola (Mock)', taxa_entrega: 7, ativo: true, tempo_estimado_entrega_minutos: 45 },
  ];
}

function getMockCategorias(): CategoriaAdmin[] {
  return [
    { id: 'cat1', nome: 'Bebidas (Mock)', ordem: 10, mostrar_nos_filtros_homepage: true },
    { id: 'cat2', nome: 'Pizzas Salgadas (Mock)', ordem: 20, mostrar_nos_filtros_homepage: true },
    { id: 'cat3', nome: 'Pizzas Doces (Mock)', ordem: 30, mostrar_nos_filtros_homepage: true },
    { id: 'cat4', nome: 'Hambúrgueres (Mock)', ordem: 40, mostrar_nos_filtros_homepage: true },
    { id: 'cat-pizzas-base', nome: 'Pizzas (para montar - Mock)', ordem: 5, mostrar_nos_filtros_homepage: false }, // Categoria para bases de pizza
  ];
}

function getMockProdutos(): ProdutoAdmin[] {
   const mockCategoriasData = getMockCategorias();
   const pizzaBaseCatId = mockCategoriasData.find(c => c.nome.includes("Pizzas (para montar"))?.id || 'cat-pizzas-base';
   const bebidasCatId = mockCategoriasData.find(c => c.nome.includes("Bebidas"))?.id || 'cat1';
   const salgadasCatId = mockCategoriasData.find(c => c.nome.includes("Pizzas Salgadas"))?.id || 'cat2';


  const mockGrupos: GrupoOpcional[] = [
    {
      id: 'grupo_refri',
      nome: 'Escolha seu Refrigerante',
      tipo_selecao: 'RADIO_OBRIGATORIO',
      ordem: 1,
      ativo: true,
      itens: [
        { id: 'refri_coca', nome: 'Coca-Cola Lata (Mock)', preco_adicional: 0, ativo: true, ordem: 1, default_selecionado: true },
        { id: 'refri_guarana', nome: 'Guaraná Lata (Mock)', preco_adicional: 0, ativo: true, ordem: 2 },
        { id: 'refri_nenhum', nome: 'Nenhum Refrigerante', preco_adicional: 0, ativo: true, ordem: 3 },
      ],
    },
    {
      id: 'grupo_acomp',
      nome: 'Acompanhamentos',
      tipo_selecao: 'CHECKBOX_OPCIONAL_MULTI',
      max_selecoes: 2,
      instrucao: 'Escolha até 2 acompanhamentos',
      ordem: 2,
      ativo: true,
      itens: [
        { id: 'acomp_fritas', nome: 'Batata Frita P (Mock)', preco_adicional: 8.00, ativo: true, ordem: 1 },
        { id: 'acomp_nuggets', nome: 'Nuggets 6 unid. (Mock)', preco_adicional: 12.00, ativo: true, ordem: 2 },
        { id: 'acomp_nenhum', nome: 'Nenhum Acompanhamento', preco_adicional: 0, ativo: true, ordem: 3, default_selecionado: true },
      ],
    },
  ];


  return [
    // Pizza Base para Montagem
    {
      id: 'pizza_base_grande',
      nome: 'Pizza Grande (Monte a Sua - Mock)',
      descricao: 'Escolha até 2 sabores para sua pizza grande.',
      preco_base: 0, // O preço será calculado pelos sabores
      categoria_id: pizzaBaseCatId,
      ativo: true,
      mostrar_no_cardapio: true,
      is_personalizable_pizza: true,
      available_sizes: ['Grande'],
      imagem_url: 'https://placehold.co/300x200.png',
      image_hint: 'customizable pizza',
    },
    // Produto Simples (Bebida)
    {
      id: 'produto1',
      nome: 'Coca-Cola Lata (Mock)',
      descricao: 'Refrigerante Coca-Cola em lata 350ml.',
      preco_base: 5.00,
      categoria_id: bebidasCatId,
      ativo: true,
      mostrar_no_cardapio: true,
      is_personalizable_pizza: false,
      imagem_url: 'https://placehold.co/300x200.png',
      image_hint: 'coke can',
    },
    // Produto com Opcionais (Hambúrguer)
    {
      id: 'produto2',
      nome: 'X-Burger Clássico (Mock)',
      descricao: 'Hambúrguer artesanal com queijo, alface e tomate.',
      preco_base: 25.00,
      categoria_id: mockCategoriasData.find(c => c.nome.includes("Hambúrgueres"))?.id || 'cat4',
      ativo: true,
      mostrar_no_cardapio: true,
      is_personalizable_pizza: false,
      grupos_opcionais_ids: [mockGrupos[0].id, mockGrupos[1].id], // Simula associação
      gruposDeOpcionais: mockGrupos, // Inclui os dados completos dos grupos
      imagem_url: 'https://placehold.co/300x200.png',
      image_hint: 'burger',
    },
    // Produto Simples (Outra Bebida)
    {
      id: 'produto3',
      nome: 'Guaraná Antártica Lata (Mock)',
      descricao: 'Refrigerante Guaraná Antártica em lata 350ml.',
      preco_base: 4.50,
      categoria_id: bebidasCatId,
      ativo: true,
      mostrar_no_cardapio: true,
      is_personalizable_pizza: false,
      imagem_url: 'https://placehold.co/300x200.png',
      image_hint: 'soda can',
    },
  ];
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Use mock data functions
  const sabores = getMockSaboresPizza();
  const bordas = getMockBordasPizza();
  const adicionais = getMockAdicionaisPizza();
  const bairros = getMockBairrosEntrega();
  const produtos = getMockProdutos();
  const categorias = getMockCategorias();

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
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
