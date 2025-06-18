"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/menu/ProductCard";
import { OrderSummary } from "@/components/order/OrderSummary";
import { Button } from "@/components/ui/button";
import type { ProdutoAdmin, CategoriaAdmin } from "@/types";

interface HomePageClientContentProps {
  categorias: CategoriaAdmin[];
  produtos: ProdutoAdmin[];
}

export function HomePageClientContent({
  categorias,
  produtos,
}: HomePageClientContentProps) {
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(
    null
  );

  /* -------------------------------------------------
   * 1. produtosFiltrados
   * ------------------------------------------------*/
  const produtosFiltrados = useMemo(() => {
    // sem filtro → mostra tudo
    if (!selectedCategoriaId) return produtos;

    // com filtro → mesma categoria OU pizza personalizável
    return produtos.filter(
      (p) => p.categoria_id === selectedCategoriaId || p.is_personalizable_pizza
    );
  }, [selectedCategoriaId, produtos]);

  /* nome da categoria só para a mensagem “Nenhum produto …” */
  const categoriaSelecionadaNome =
    selectedCategoriaId &&
    categorias.find((c) => c.id === selectedCategoriaId)?.nome;

  /* ------------------------------------------------- */
  return (
    <>
      {categorias.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2 justify-center lg:justify-start">
          <Button
            variant={selectedCategoriaId === null ? "default" : "outline"}
            onClick={() => setSelectedCategoriaId(null)}
            className="rounded-full shadow-sm hover:shadow-md transition-shadow"
          >
            Todos
          </Button>

          {categorias.map((categoria) => (
            <Button
              key={categoria.id}
              variant={
                selectedCategoriaId === categoria.id ? "default" : "outline"
              }
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
          {produtosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {produtosFiltrados.map((produto) => (
                <ProductCard key={produto.id} produto={produto} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {selectedCategoriaId
                ? `Nenhum produto encontrado em "${categoriaSelecionadaNome}".`
                : "Nenhum produto encontrado."}
            </p>
          )}
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <OrderSummary />
        </div>
      </div>
    </>
  );
}
