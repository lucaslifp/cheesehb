
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyTotal } from '@/components/order/StickyTotal';
import type { ProdutoAdmin, CategoriaAdmin } from '@/types';
import { HomePageClientContent } from '@/components/layout/HomePageClientContent';

export const metadata: Metadata = {
  title: 'Cardápio | PizzAI Ordering',
  description: 'Confira nosso cardápio completo e peça sua pizza favorita!',
};

const getApiBaseUrl = (): string => {
  // 1. Use NEXT_PUBLIC_API_URL if explicitly set.
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, ''); // Remove trailing slash
  }

  // 2. If running on the server (e.g., during build or SSR for Server Components)
  //    and NEXT_PUBLIC_API_URL is not set, construct an absolute URL.
  if (typeof window === 'undefined') {
    // Vercel provides VERCEL_URL, otherwise use localhost and PORT (or default from dev script)
    const protocol = process.env.VERCEL_URL ? 'https' : 'http';
    const host = process.env.VERCEL_URL || `localhost:${process.env.PORT || 9002}`;
    return `${protocol}://${host}`;
  }

  // 3. For client-side execution where NEXT_PUBLIC_API_URL is not set,
  //    relative paths are fine. An empty string means fetch will use the current origin.
  return '';
};


async function getHomepageData(): Promise<{ categorias: CategoriaAdmin[]; produtos: ProdutoAdmin[] }> {
  let categorias: CategoriaAdmin[] = [];
  let generalProducts: ProdutoAdmin[] = [];
  let pizzaBases: ProdutoAdmin[] = [];
  const apiBaseUrl = getApiBaseUrl();

  try {
    const categoriasRes = await fetch(`${apiBaseUrl}/api/admin/categorias`, { cache: 'no-store' });
    if (categoriasRes.ok) {
      categorias = await categoriasRes.json();
    } else {
      console.error('Failed to fetch categories:', categoriasRes.status, await categoriasRes.text().catch(() => 'Failed to read error body'));
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }

  try {
    const generalProductsRes = await fetch(`${apiBaseUrl}/api/admin/produtos?personalizable=false`, { cache: 'no-store' });
    if (generalProductsRes.ok) {
      generalProducts = await generalProductsRes.json();
    } else {
      console.error('Failed to fetch general products:', generalProductsRes.status, await generalProductsRes.text().catch(() => 'Failed to read error body'));
    }
  } catch (error) {
    console.error('Error fetching general products:', error);
  }

  try {
    const pizzaBasesRes = await fetch(`${apiBaseUrl}/api/admin/produtos?personalizable=true`, { cache: 'no-store' });
    if (pizzaBasesRes.ok) {
      pizzaBases = await pizzaBasesRes.json();
    } else {
      console.error('Failed to fetch pizza bases:', pizzaBasesRes.status, await pizzaBasesRes.text().catch(() => 'Failed to read error body'));
    }
  } catch (error) {
    console.error('Error fetching pizza bases:', error);
  }

  const allProducts = [...generalProducts, ...pizzaBases].sort((a, b) => a.nome.localeCompare(b.nome));
  
  const displayableProducts = allProducts.filter(produto => {
    if (produto.is_personalizable_pizza) return true; 
    const category = categorias.find(cat => cat.id === produto.categoria_id);
    return category && category.mostrar_nos_filtros_homepage;
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
