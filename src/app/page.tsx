// src/app/page.tsx

import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyTotal } from "@/components/order/StickyTotal";
import type { ProdutoAdmin, CategoriaAdmin } from "@/types";
import { HomePageClientContent } from "@/components/layout/HomePageClientContent";

export const metadata: Metadata = {
  title: "Cardápio | PizzAI Ordering",
  description: "Confira nosso cardápio completo e peça sua pizza favorita!",
};

const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    const protocol = process.env.VERCEL_URL ? "https" : "http";
    const host =
      process.env.VERCEL_URL || `localhost:${process.env.PORT || 9002}`;
    return `${protocol}://${host}`;
  }

  return "";
};

async function getHomepageData(): Promise<{
  categorias: CategoriaAdmin[];
  produtos: ProdutoAdmin[];
}> {
  const apiBaseUrl = getApiBaseUrl();
  let produtos: ProdutoAdmin[] = [];
  let categorias: CategoriaAdmin[] = [];

  try {
    const res = await fetch(`${apiBaseUrl}/api/shop-status-public`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      // compatibilidade com frontend: transforma preco_base em preco
      produtos = (data.produtos || []).map((p: any) => ({
        ...p,
        preco: p.preco_base ?? 0,
      }));
    } else {
      console.error(
        "Erro ao buscar dados públicos:",
        res.status,
        await res.text()
      );
    }
  } catch (error) {
    console.error("Erro ao buscar produtos públicos:", error);
  }

  try {
    const categoriasRes = await fetch(`${apiBaseUrl}/api/admin/categorias`, {
      cache: "no-store",
    });
    if (categoriasRes.ok) {
      categorias = await categoriasRes.json();
    } else {
      console.error(
        "Erro ao buscar categorias:",
        categoriasRes.status,
        await categoriasRes.text()
      );
    }
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
  }

  const displayableProducts = produtos.filter((produto) => {
    if (produto.is_personalizable_pizza) return true;
    const categoria = categorias.find((cat) => cat.id === produto.categoria_id);
    return categoria && categoria.mostrar_nos_filtros_homepage;
  });

  return { categorias, produtos: displayableProducts };
}

export default async function HomePage() {
  const { categorias, produtos } = await getHomepageData();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <HomePageClientContent categorias={categorias} produtos={produtos} />
      </main>
      <StickyTotal />
      <Footer />
    </div>
  );
}
