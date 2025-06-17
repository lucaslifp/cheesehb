
"use client";

import { useState, useMemo } from 'react';
import { ProductCard } from '@/components/menu/ProductCard';
import { OrderSummary } from '@/components/order/OrderSummary';
import { Button } from '@/components/ui/button';
import type { ProdutoAdmin, CategoriaAdmin } from '@/types';

interface HomePageClientContentProps {
  categorias: CategoriaAdmin[];
  produtos: ProdutoAdmin[];
}

export function HomePageClientContent({ categorias, produtos }: HomePageClientContentProps) {
  console.log('HomePageClientContent rendering/re-evaluating'); // Added console.log
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(null);

  // Filter categories that should be shown in the filter bar
  const categoriasParaFiltro = useMemo(() => {
    return categorias
      .filter(cat => cat.mostrar_nos_filtros_homepage === true)
      .sort((a, b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity));
  }, [categorias]);

  // Filter products based on the selected category
  // Products passed here are already pre-filtered by the server component (page.tsx)
  // to include only those associated with categories marked 'mostrar_nos_filtros_homepage: true'
  // OR personalizable pizzas.
  const produtosFiltrados = useMemo(() => {
    if (!selectedCategoriaId) {
      // If no category is selected, show all products that are either:
      // 1. Personalizable pizzas (these have their own cards like "Monte sua Pizza")
      // 2. General products belonging to a category that IS in `categoriasParaFiltro`
      return produtos.filter(p => 
        p.is_personalizable_pizza || 
        (p.categoria_id && categoriasParaFiltro.some(cat => cat.id === p.categoria_id))
      );
    }
    // If a category is selected, show products of that category AND personalizable pizzas
    // (as "Monte sua Pizza" cards should ideally always be visible or handled by their own logic)
    return produtos.filter(
      (produto) => produto.categoria_id === selectedCategoriaId || produto.is_personalizable_pizza
    );
  }, [selectedCategoriaId, produtos, categoriasParaFiltro]);

  const categoriaSelecionadaNome = selectedCategoriaId 
    ? categorias.find(c => c.id === selectedCategoriaId)?.nome ?? '' 
    : '';

  return (
    <>
      {categoriasParaFiltro.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2 justify-center lg:justify-start">
          <Button
            variant={selectedCategoriaId === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategoriaId(null)}
            className="rounded-full shadow-sm hover:shadow-md transition-shadow"
          >
            Todos
          </Button>
          {categoriasParaFiltro.map((categoria) => (
            <Button
              key={categoria.id}
              variant={selectedCategoriaId === categoria.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategoriaId(categoria.id)}
              className="rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              {categoria.nome}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-12">
          <div>
            {produtosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"> {/* Adjusted grid for potentially 3 cards */}
                {produtosFiltrados.map((produto) => (
                  <ProductCard key={produto.id} produto={produto} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {selectedCategoriaId 
                  ? `Nenhum produto encontrado na categoria "${categoriaSelecionadaNome}".` 
                  : "Nenhum produto encontrado."}
              </p>
            )}
          </div>
        </div>
        <div className="lg:col-span-1 lg:sticky lg:top-24"> {/* Adjusted sticky top */}
          <OrderSummary />
        </div>
      </div>
    </>
  );
}
