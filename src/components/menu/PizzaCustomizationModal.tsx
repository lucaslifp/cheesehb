/* ----------------------------------------------------------------
 * src/components/menu/PizzaCustomizationModal.tsx
 * ----------------------------------------------------------------*/
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type {
  ProdutoAdmin,
  SaborPizza,
  Borda,
  AdicionalPizza,
  AdicionalSelecionado,
  CategoriaAdmin,
} from "@/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/hooks/use-toast";

import {
  Minus,
  Plus,
  Pizza,
  GlassWater,
  MinusCircle,
  PlusCircle,
  MessageSquareText,
} from "lucide-react";

/* ----------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------*/

// gera um item “fake” para “sem borda” caso não exista no banco
const makeSemBorda = (): Borda => ({
  id: "__sem_borda__",
  nome: "Sem borda recheada",
  descricao: "",
  preco_pequena: 0,
  preco_grande: 0,
  ativo: true,
  created_at: "" as any,
});

const BEBIDAS_CATEGORIA_NOME = "Bebidas";

/* ----------------------------------------------------------------
 * Componente
 * ----------------------------------------------------------------*/

interface PizzaCustomizationModalProps {
  produto: ProdutoAdmin;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PizzaCustomizationModal({
  produto,
  isOpen,
  onOpenChange,
}: PizzaCustomizationModalProps) {
  /* ------------------ context ------------------ */
  const {
    addToCart,
    getSaborById,
    getBordaById,
    isShopOpen,
    shopStatusMessage,
    sabores,
    bordas,
    adicionaisPizza,
    produtos,
    categorias,
  } = useCart();

  /* ------------------ states ------------------- */
  const [flavorPortions, setFlavorPortions] = useState<Record<string, number>>(
    {}
  );

  /* ----- borda default: “sem borda”/primeira ----- */
  const bordasDisponiveis = useMemo<Borda[]>(() => {
    const lista = bordas.filter((b) => b.ativo);

    if (!lista.some((b) => /sem borda|não quero/i.test(b.nome))) {
      lista.unshift(makeSemBorda());
    }
    return lista;
  }, [bordas]);

  const defaultBordaNaoQuero = useMemo(
    () => bordasDisponiveis.find((b) => /sem borda|não quero/i.test(b.nome)),
    [bordasDisponiveis]
  );
  const defaultBordaId =
    defaultBordaNaoQuero?.id ?? bordasDisponiveis[0]?.id ?? "";

  const [selectedBordaId, setSelectedBordaId] =
    useState<string>(defaultBordaId);
  const [selectedAdicionaisCobertura, setSelectedAdicionaisCobertura] =
    useState<AdicionalSelecionado[]>([]);
  const [selectedBebidas, setSelectedBebidas] = useState<
    AdicionalSelecionado[]
  >([]);
  const [observacoesItem, setObservacoesItem] = useState("");

  /* ---------------- calculos derivados ---------------- */
  const isGrande = produto.available_sizes?.includes("Grande");

  const saboresDisponiveis = useMemo(() => {
    if (!produto.tipo_pizza) return [];
    return sabores.filter(
      (s) =>
        s.categoria_sabor.toLowerCase() === produto.tipo_pizza?.toLowerCase() &&
        s.ativo
    );
  }, [sabores, produto.tipo_pizza]);

  const ingredientesAdicionaisDisponiveis = useMemo(
    () => adicionaisPizza.filter((ad) => ad.ativo),
    [adicionaisPizza]
  );

  const bebidasDisponiveis: ProdutoAdmin[] = useMemo(() => {
    const categoriaBebidas = categorias.find(
      (cat) => cat.nome.toLowerCase() === BEBIDAS_CATEGORIA_NOME.toLowerCase()
    );
    if (categoriaBebidas) {
      return produtos.filter(
        (p) =>
          p.categoria_id === categoriaBebidas.id &&
          p.ativo &&
          p.mostrar_no_cardapio
      );
    }
    return [];
  }, [produtos, categorias]);

  const totalPortionsSelected = useMemo(
    () => Object.values(flavorPortions).reduce((sum, c) => sum + c, 0),
    [flavorPortions]
  );

  /* ---------------- handlers ---------------- */
  const handlePortionChange = useCallback((saborId: string, change: 1 | -1) => {
    setFlavorPortions((prev) => {
      const current = prev[saborId] || 0;
      const updated = current + change;
      if (updated < 0 || updated > 2) return prev;
      const newTotal =
        Object.values(prev).reduce((sum, c) => sum + c, 0) - current + updated;
      if (newTotal > 2) {
        toast({
          title: "Limite atingido",
          description: "Máximo 2 porções de sabores.",
        });
        return prev;
      }
      const next = { ...prev, [saborId]: updated };
      if (next[saborId] === 0) delete next[saborId];
      return next;
    });
  }, []);

  /* ---------------- preços ---------------- */
  const calculatedPizzaPrice = useMemo(() => {
    let price = 0;
    const portionsArray = Object.entries(flavorPortions).filter(
      ([, c]) => c > 0
    );

    if (portionsArray.length === 1 && portionsArray[0][1] === 2) {
      // inteira de um sabor
      const sabor = getSaborById(portionsArray[0][0]);
      if (sabor) price = isGrande ? sabor.preco_grande : sabor.preco_pequena;
    } else if (
      portionsArray.length === 2 &&
      portionsArray[0][1] === 1 &&
      portionsArray[1][1] === 1
    ) {
      // meio a meio
      const sabor1 = getSaborById(portionsArray[0][0]);
      const sabor2 = getSaborById(portionsArray[1][0]);
      if (sabor1 && sabor2) {
        const p1 = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
        const p2 = isGrande ? sabor2.preco_grande : sabor2.preco_pequena;
        price = p1 / 2 + p2 / 2;
      }
    } else if (portionsArray.length === 1 && portionsArray[0][1] === 1) {
      // meia pizza
      const sabor = getSaborById(portionsArray[0][0]);
      if (sabor)
        price = (isGrande ? sabor.preco_grande : sabor.preco_pequena) / 2;
    }
    price += produto.preco_base ?? 0;
    return price;
  }, [flavorPortions, isGrande, getSaborById, produto.preco_base]);

  const calculatedTotalPrice = useMemo(() => {
    let price = calculatedPizzaPrice;

    const borda = selectedBordaId ? getBordaById(selectedBordaId) : null;
    if (borda) {
      const extra = isGrande
        ? borda.preco_grande ?? 0
        : borda.preco_pequena ?? 0;
      if (borda.id !== "__sem_borda__" && extra > 0) price += extra;
    }
    selectedAdicionaisCobertura.forEach(
      (ad) => (price += ad.preco * ad.quantidade)
    );
    selectedBebidas.forEach((b) => (price += b.preco * b.quantidade));
    return price;
  }, [
    calculatedPizzaPrice,
    selectedBordaId,
    selectedAdicionaisCobertura,
    selectedBebidas,
    getBordaById,
    isGrande,
  ]);

  /* ---------------- default reset ---------------- */
  useEffect(() => {
    if (!isOpen) {
      setFlavorPortions({});
      setSelectedBordaId(defaultBordaId);
      setSelectedAdicionaisCobertura([]);
      setSelectedBebidas([]);
      setObservacoesItem("");
    } else {
      setSelectedBordaId(defaultBordaId);
    }
  }, [isOpen, defaultBordaId]);

  /* ----------------------------------------------------------------
   *  Render
   * ----------------------------------------------------------------*/
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Pizza className="mr-3 h-7 w-7 text-primary" />
            Montar {produto.nome}
          </DialogTitle>
          <DialogDescription>
            Selecione 2 porções (mesmo sabor ou meio a meio).
          </DialogDescription>
        </DialogHeader>

        {/* ---------------------------------------------------------------- */}
        {/*  SCROLLABLE BODY                                                 */}
        {/* ---------------------------------------------------------------- */}
        <ScrollArea className="max-h-[60vh] p-1 pr-3">
          {/* ================================================================= */}
          {/* SABORES                                                          */}
          {/* ================================================================= */}
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Escolha os Sabores ({totalPortionsSelected}/2)
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {saboresDisponiveis.map((sabor) => {
                  const count = flavorPortions[sabor.id] || 0;
                  const precoInteira = isGrande
                    ? sabor.preco_grande
                    : sabor.preco_pequena;
                  return (
                    <Card
                      key={sabor.id}
                      className="shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <p className="font-medium text-sm">{sabor.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              Inteira: R${" "}
                              {precoInteira.toFixed(2).replace(".", ",")}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => handlePortionChange(sabor.id, -1)}
                              disabled={count === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {count}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => handlePortionChange(sabor.id, 1)}
                              disabled={
                                count === 2 || totalPortionsSelected >= 2
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPortionsSelected !== 2 && (
                <p className="text-xs text-destructive pt-1">
                  Selecione 2 porções.
                </p>
              )}
            </div>

            {/* ================================================================= */}
            {/* BORDAS                                                           */}
            {/* ================================================================= */}
            {bordasDisponiveis.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold">
                  Borda Recheada
                </Label>
                <RadioGroup
                  value={selectedBordaId}
                  onValueChange={setSelectedBordaId}
                  className="space-y-2"
                >
                  {bordasDisponiveis.map((borda) => {
                    const extra = isGrande
                      ? borda.preco_grande ?? 0
                      : borda.preco_pequena ?? 0;
                    return (
                      <div
                        key={borda.id}
                        className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-muted/30 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                      >
                        <RadioGroupItem
                          value={borda.id}
                          id={`borda-${borda.id}`}
                        />
                        <Label
                          htmlFor={`borda-${borda.id}`}
                          className="text-sm font-medium flex-grow cursor-pointer"
                        >
                          {borda.nome}
                          {extra > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (+R$ {extra.toFixed(2).replace(".", ",")})
                            </span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* (demais seções ... bebidas, adicionais, observações) */}
            {/* ================================================================= */}
            {/* Bebidas, Adicionais, Observações - mantidas como estavam          */}
            {/* ================================================================= */}
            {/* ...                                                               */}
          </div>
        </ScrollArea>

        {/* ---------------------------------------------------------------- */}
        {/*  FOOTER                                                          */}
        {/* ---------------------------------------------------------------- */}
        <Separator className="my-2" />
        <DialogFooter className="sm:justify-between items-center pt-2 mt-0">
          <div className="text-xl font-bold text-primary">
            Total: R$ {calculatedTotalPrice.toFixed(2).replace(".", ",")}
          </div>

          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>

            <Button
              onClick={/* seu handler */ () => {}}
              disabled={totalPortionsSelected !== 2 || !isShopOpen}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Adicionar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
