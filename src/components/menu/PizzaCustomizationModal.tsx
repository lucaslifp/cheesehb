/* ----------------------------------------------------------------
 * src/components/menu/PizzaCustomizationModal.tsx
 * ----------------------------------------------------------------*/
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import type {
  ProdutoAdmin,
  Borda,
  AdicionalPizza,
  AdicionalSelecionado,
} from "@/types";
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
 * Constantes & helpers
 * ----------------------------------------------------------------*/
const BEBIDAS_CATEGORIA_NOME = "Bebidas";

const fakeSemBorda = (): Borda => ({
  id: "__sem_borda__",
  nome: "Sem borda recheada",
  descricao: "",
  preco_pequena: 0,
  preco_grande: 0,
  ativo: true,
  created_at: "" as any,
});

/* ----------------------------------------------------------------
 * Props
 * ----------------------------------------------------------------*/
interface PizzaCustomizationModalProps {
  produto: ProdutoAdmin;
  isOpen: boolean;
  onOpenChange(isOpen: boolean): void;
}

/* ----------------------------------------------------------------
 * Componente
 * ----------------------------------------------------------------*/
export function PizzaCustomizationModal({
  produto,
  isOpen,
  onOpenChange,
}: PizzaCustomizationModalProps) {
  /* ----------------------------------------------------------------
   * Contexto / hooks de carrinho
   * ----------------------------------------------------------------*/
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

  /* ----------------------------------------------------------------
   * Estados
   * ----------------------------------------------------------------*/
  const [flavorPortions, setFlavorPortions] = useState<Record<string, number>>(
    {}
  );
  const [selectedBordaId, setSelectedBordaId] = useState<string>("");
  const [selectedAdicionais, setSelectedAdicionais] = useState<
    AdicionalSelecionado[]
  >([]);
  const [selectedBebidas, setSelectedBebidas] = useState<
    AdicionalSelecionado[]
  >([]);
  const [observacoes, setObservacoes] = useState("");

  /* ----------------------------------------------------------------
   * Dados derivados
   * ----------------------------------------------------------------*/
  /** lista somente bordas ativas + “sem borda” gerado */
  const bordasDisponiveis = useMemo((): Borda[] => {
    const list = bordas.filter((b) => b.ativo);
    if (!list.some((b) => /sem borda|não quero/i.test(b.nome))) {
      list.unshift(fakeSemBorda());
    }
    return list;
  }, [bordas]);

  const defaultBorda = useMemo(
    () =>
      bordasDisponiveis.find((b) => /sem borda|não quero/i.test(b.nome)) ??
      bordasDisponiveis[0],
    [bordasDisponiveis]
  );

  /** sabores que pertencem ao tipo “salgada / doce / mista” da pizza */
  const saboresDisponiveis = useMemo(() => {
    if (!produto.tipo_pizza) return [];
    return sabores.filter(
      (s) =>
        s.ativo &&
        s.categoria_sabor.toLowerCase() === produto.tipo_pizza.toLowerCase()
    );
  }, [sabores, produto.tipo_pizza]);

  /** adicionais de cobertura (checkboxes) */
  const adicionaisDisponiveis = useMemo(
    () => adicionaisPizza.filter((a) => a.ativo),
    [adicionaisPizza]
  );

  /** bebidas: pegar categoria “Bebidas” e filtrar produtos ativos */
  const bebidasDisponiveis = useMemo<ProdutoAdmin[]>(() => {
    const cat = categorias.find(
      (c) => c.nome.toLowerCase() === BEBIDAS_CATEGORIA_NOME.toLowerCase()
    );
    if (!cat) return [];
    return produtos.filter(
      (p) => p.categoria_id === cat.id && p.ativo && p.mostrar_no_cardapio
    );
  }, [produtos, categorias]);

  /* tamanho para cálculo de preço da borda */
  const isGrande = produto.available_sizes?.includes("Grande");

  /** porções já escolhidas */
  const totalPorcoes = useMemo(
    () => Object.values(flavorPortions).reduce((s, c) => s + c, 0),
    [flavorPortions]
  );

  /* ----------------------------------------------------------------
   * Handlers
   * ----------------------------------------------------------------*/
  /** +1 / -1 numa porção */
  const handlePortionChange = (saborId: string, delta: 1 | -1) => {
    setFlavorPortions((prev) => {
      const atual = prev[saborId] ?? 0;
      const novo = atual + delta;
      if (novo < 0 || novo > 2) return prev; // cada sabor máx. 2 porções
      const totalSimulado =
        Object.values(prev).reduce((s, c) => s + c, 0) - atual + novo;
      if (totalSimulado > 2) {
        toast({
          title: "Limite atingido",
          description: "Escolha exatamente 2 porções de sabores.",
        });
        return prev;
      }
      const next = { ...prev, [saborId]: novo };
      if (next[saborId] === 0) delete next[saborId];
      return next;
    });
  };

  /** toggle / quantidade de adicionais de cobertura */
  const toggleAdicional = (ad: AdicionalPizza, marcado: boolean) => {
    setSelectedAdicionais((prev) =>
      marcado
        ? [...prev, { ...ad, quantidade: 1 }]
        : prev.filter((i) => i.id !== ad.id)
    );
  };
  const changeQtdAdicional = (id: string, delta: number) => {
    setSelectedAdicionais((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? {
                ...i,
                quantidade: Math.max(0, Math.min(5, i.quantidade + delta)),
              }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  };

  /** toggle / quantidade bebidas */
  const toggleBebida = (prod: ProdutoAdmin, marcado: boolean) => {
    setSelectedBebidas((prev) =>
      marcado
        ? [
            ...prev,
            {
              id: prod.id,
              nome: prod.nome,
              preco: prod.preco_base ?? 0,
              quantidade: 1,
            },
          ]
        : prev.filter((b) => b.id !== prod.id)
    );
  };
  const changeQtdBebida = (id: string, delta: number) => {
    setSelectedBebidas((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, quantidade: Math.max(1, Math.min(5, b.quantidade + delta)) }
          : b
      )
    );
  };

  /* ----------------------------------------------------------------
   * Preço
   * ----------------------------------------------------------------*/
  /** preço da pizza baseado nas porções */
  const precoPizza = useMemo(() => {
    const entradas = Object.entries(flavorPortions).filter(([, q]) => q > 0);

    if (entradas.length === 0) return 0;

    const valorSabor = (saborId: string, factor = 1) => {
      const sabor = getSaborById(saborId);
      if (!sabor) return 0;
      const base = isGrande ? sabor.preco_grande : sabor.preco_pequena;
      return base * factor;
    };

    let valor = 0;
    if (entradas.length === 1) {
      const [id, q] = entradas[0];
      valor = valorSabor(id, q / 2); // q = 1 -> meia; q =2 -> inteira
    } else if (
      entradas.length === 2 &&
      entradas[0][1] === 1 &&
      entradas[1][1] === 1
    ) {
      valor = valorSabor(entradas[0][0], 0.5) + valorSabor(entradas[1][0], 0.5);
    }
    return valor + (produto.preco_base ?? 0);
  }, [flavorPortions, isGrande, getSaborById, produto.preco_base]);

  /** preço total (pizza + borda + adicionais + bebidas) */
  const precoTotal = useMemo(() => {
    let v = precoPizza;

    const borda = getBordaById(selectedBordaId);
    if (borda && borda.id !== "__sem_borda__") {
      v += isGrande ? borda.preco_grande ?? 0 : borda.preco_pequena ?? 0;
    }

    selectedAdicionais.forEach((a) => (v += a.preco * a.quantidade));
    selectedBebidas.forEach((b) => (v += b.preco * b.quantidade));
    return v;
  }, [
    precoPizza,
    selectedBordaId,
    getBordaById,
    isGrande,
    selectedAdicionais,
    selectedBebidas,
  ]);

  /* ----------------------------------------------------------------
   * Submit
   * ----------------------------------------------------------------*/
  const handleAdd = () => {
    if (totalPorcoes !== 2) {
      toast({
        title: "Seleção incompleta",
        description: "Escolha exatamente 2 porções.",
        variant: "destructive",
      });
      return;
    }
    if (!isShopOpen) {
      toast({
        title: "Loja fechada",
        description: shopStatusMessage,
        variant: "destructive",
      });
      return;
    }

    // determinar ids de sabor1 / sabor2
    const entradas = Object.entries(flavorPortions).filter(([, q]) => q > 0);
    let s1: string | undefined, s2: string | undefined;
    if (entradas.length === 1 && entradas[0][1] === 2) {
      s1 = s2 = entradas[0][0];
    } else if (
      entradas.length === 2 &&
      entradas[0][1] === 1 &&
      entradas[1][1] === 1
    ) {
      s1 = entradas[0][0];
      s2 = entradas[1][0];
    }

    addToCart(
      produto,
      1,
      selectedAdicionais,
      s1,
      s2,
      selectedBordaId,
      undefined,
      observacoes.trim() || undefined
    );

    // bebidas extras também entram no carrinho
    selectedBebidas.forEach((b) => {
      const original = produtos.find((p) => p.id === b.id);
      if (original) addToCart(original, b.quantidade);
    });

    toast({ title: "Adicionado ao carrinho!" });
    onOpenChange(false);
  };

  /* ----------------------------------------------------------------
   * Efeitos de reset
   * ----------------------------------------------------------------*/
  useEffect(() => {
    if (isOpen) {
      setSelectedBordaId(defaultBorda.id);
    } else {
      setFlavorPortions({});
      setSelectedAdicionais([]);
      setSelectedBebidas([]);
      setObservacoes("");
    }
  }, [isOpen, defaultBorda.id]);

  /* ----------------------------------------------------------------
   * RENDER
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

        {/* ---------- BODY (scroll) ---------- */}
        <ScrollArea className="max-h-[60vh] p-1 pr-3">
          <div className="space-y-6 py-4">
            {/* ============================== SABORES ============================== */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Escolha os Sabores ({totalPorcoes}/2)
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {saboresDisponiveis.map((s) => {
                  const qtd = flavorPortions[s.id] ?? 0;
                  const precoInteira = isGrande
                    ? s.preco_grande
                    : s.preco_pequena;
                  return (
                    <Card
                      key={s.id}
                      className="shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <p className="font-medium text-sm">{s.nome}</p>
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
                              onClick={() => handlePortionChange(s.id, -1)}
                              disabled={qtd === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {qtd}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => handlePortionChange(s.id, 1)}
                              disabled={qtd === 2 || totalPorcoes >= 2}
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

              {totalPorcoes !== 2 && (
                <p className="text-xs text-destructive pt-1">
                  Selecione 2 porções.
                </p>
              )}
            </div>

            {/* ============================== BORDAS ============================== */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-semibold">Borda Recheada</Label>
              <RadioGroup
                value={selectedBordaId}
                onValueChange={setSelectedBordaId}
                className="space-y-2"
              >
                {bordasDisponiveis.map((b) => {
                  const extra = isGrande
                    ? b.preco_grande ?? 0
                    : b.preco_pequena ?? 0;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-muted/30 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary"
                    >
                      <RadioGroupItem value={b.id} id={`b-${b.id}`} />
                      <Label
                        htmlFor={`b-${b.id}`}
                        className="text-sm font-medium flex-grow cursor-pointer"
                      >
                        {b.nome}
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

            {/* ============================== BEBIDAS ============================== */}
            {bebidasDisponiveis.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold flex items-center">
                  <GlassWater className="mr-2 h-5 w-5 text-primary" />
                  Bebidas (Opcional)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {bebidasDisponiveis.map((p) => {
                    const sel = selectedBebidas.find((b) => b.id === p.id);
                    const marcado = !!sel;
                    return (
                      <Card key={p.id} className="border bg-muted/30 p-3">
                        <div className="flex justify-between items-start">
                          <Label
                            htmlFor={`bebida-${p.id}`}
                            className="flex items-center text-sm font-medium"
                          >
                            <Checkbox
                              id={`bebida-${p.id}`}
                              checked={marcado}
                              onCheckedChange={(c) => toggleBebida(p, !!c)}
                              className="mr-2"
                            />
                            {p.nome}
                          </Label>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            +R${" "}
                            {(p.preco_base ?? 0).toFixed(2).replace(".", ",")}
                          </span>
                        </div>

                        {marcado && (
                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => changeQtdBebida(p.id, -1)}
                              disabled={sel!.quantidade <= 1}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <Input
                              readOnly
                              value={sel!.quantidade}
                              className="h-7 w-10 text-center text-sm p-0"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => changeQtdBebida(p.id, 1)}
                              disabled={sel!.quantidade >= 5}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================== ADICIONAIS ============================ */}
            {adicionaisDisponiveis.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold">
                  Adicionais (Opcional)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {adicionaisDisponiveis.map((ad) => {
                    const sel = selectedAdicionais.find((a) => a.id === ad.id);
                    const marcado = !!sel;
                    return (
                      <Card key={ad.id} className="border bg-muted/30 p-3">
                        <div className="flex justify-between items-start">
                          <Label
                            htmlFor={`ad-${ad.id}`}
                            className="flex items-center text-sm font-medium"
                          >
                            <Checkbox
                              id={`ad-${ad.id}`}
                              checked={marcado}
                              onCheckedChange={(c) => toggleAdicional(ad, !!c)}
                              className="mr-2"
                            />
                            {ad.nome}
                          </Label>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            +R$ {ad.preco.toFixed(2).replace(".", ",")}
                          </span>
                        </div>

                        {marcado && (
                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => changeQtdAdicional(ad.id, -1)}
                              disabled={sel!.quantidade <= 1}
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <Input
                              readOnly
                              value={sel!.quantidade}
                              className="h-7 w-10 text-center text-sm p-0"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => changeQtdAdicional(ad.id, 1)}
                              disabled={sel!.quantidade >= 5}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================== OBSERVAÇÕES =========================== */}
            <div className="space-y-3 pt-4 border-t">
              <Label
                htmlFor="obs"
                className="text-base font-semibold flex items-center"
              >
                <MessageSquareText className="mr-2 h-5 w-5 text-primary" />
                Comentário?
              </Label>
              <Textarea
                id="obs"
                placeholder="Ex.: Bem assada, sem cebola…"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>
        </ScrollArea>

        {/* ---------- FOOTER ---------- */}
        <Separator className="my-2" />
        <DialogFooter className="sm:justify-between items-center pt-2">
          <div className="text-xl font-bold text-primary">
            Total:&nbsp;R$ {precoTotal.toFixed(2).replace(".", ",")}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>

            <Button
              onClick={handleAdd}
              disabled={totalPorcoes !== 2 || !isShopOpen}
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
