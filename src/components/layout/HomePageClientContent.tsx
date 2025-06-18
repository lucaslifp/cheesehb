"use client";

import { useState } from "react";
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

  const categoriaSelecionadaNome = selectedCategoriaId
    ? categorias.find((c) => c.id === selectedCategoriaId)?.nome ?? ""
    : "";

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
          <div>
            {produtos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {produtos.map((produto) => (
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
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <OrderSummary />
        </div>
      </div>
    </>
  );
}
