"use client";

import Image from "next/image";
import type { Database } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Settings2, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { PizzaCustomizationModal } from "./PizzaCustomizationModal";
import { ProductCustomizationModal } from "./ProductCustomizationModal";

type ProdutoFromDB = Database["public"]["Tables"]["produtos"]["Row"] & {
  direto_no_carrinho?: boolean;
};

interface ProductCardProps {
  produto: ProdutoFromDB;
}

export function ProductCard({ produto }: ProductCardProps) {
  const { addToCart, isShopOpen, shopStatusMessage } = useCart();
  const [isPizzaModalOpen, setIsPizzaModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  /* ----------------------------------------------------------------
   * Flags de tipo
   * --------------------------------------------------------------*/
  const isMontavelPizza = produto.is_personalizable_pizza === true;
  const hasProductOptions =
    produto.grupos_opcionais_ids && produto.grupos_opcionais_ids.length > 0;
  const isCategoriaDiretoCarrinho = produto.direto_no_carrinho === true;
  const isSimpleProductRequiringQuantityModal =
    !isMontavelPizza && !hasProductOptions && !isCategoriaDiretoCarrinho;

  /* ----------------------------------------------------------------
   * Clique do botão principal
   * --------------------------------------------------------------*/
  const handleButtonClick = () => {
    if (!isShopOpen) {
      toast({
        title: "Loja Fechada",
        description: shopStatusMessage,
        variant: "destructive",
      });
      return;
    }

    if (isMontavelPizza) setIsPizzaModalOpen(true);
    else if (hasProductOptions || isSimpleProductRequiringQuantityModal)
      setIsProductModalOpen(true);
    else {
      addToCart(produto, 1);
      toast({
        title: "Produto Adicionado!",
        description: `${produto.nome} foi adicionado ao seu carrinho.`,
      });
    }
  };

  /* ----------------------------------------------------------------
   * Config do botão (texto / cor / ícone)
   * --------------------------------------------------------------*/
  let displayButtonText: string;
  let DisplayButtonIcon: React.ElementType;
  let buttonVariant: "default" | "outline" = "default";
  let buttonClassName =
    "w-full bg-accent hover:bg-accent/90 text-accent-foreground";
  let buttonDisabled = false;
  let tooltipMessage: string | null = null;

  if (!isShopOpen) {
    displayButtonText = "Loja Fechada";
    DisplayButtonIcon = Clock;
    buttonVariant = "outline";
    buttonClassName =
      "w-full text-muted-foreground border-muted-foreground/30 hover:bg-transparent cursor-not-allowed";
    buttonDisabled = true;
    tooltipMessage = shopStatusMessage;
  } else {
    if (isMontavelPizza) {
      displayButtonText = "Montar Pizza";
      DisplayButtonIcon = Edit;
    } else if (hasProductOptions) {
      displayButtonText = "Monte seu Combo";
      DisplayButtonIcon = Settings2;
    } else {
      displayButtonText = "Adicionar";
      DisplayButtonIcon = PlusCircle;
    }
  }

  /* ----------------------------------------------------------------
   * Cálculo de preço / regras de exibição
   * --------------------------------------------------------------*/
  const precoBase = produto.preco_base ?? 0;
  const precoPromo = produto.preco_promocional ?? 0;

  const isPizzaBaseSemPrecoVisivel =
    isMontavelPizza && (!produto.preco_base || produto.preco_base === 0);

  const isComboOuPizzaCustomComPrecoBase =
    hasProductOptions ||
    (isMontavelPizza && produto.preco_base && produto.preco_base > 0);

  const mostrarPrecoOferta =
    !isPizzaBaseSemPrecoVisivel &&
    !isComboOuPizzaCustomComPrecoBase &&
    precoPromo > 0 &&
    precoPromo < precoBase;

  /* ----------------------------------------------------------------
   * Render
   * --------------------------------------------------------------*/
  return (
    <>
      <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
        <CardHeader className="p-0">
          <div className="aspect-[3/2] relative w-full">
            <Image
              src={produto.imagem_url || "https://placehold.co/300x200.png"}
              alt={produto.nome}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />

            {mostrarPrecoOferta && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                OFERTA!
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 flex-grow">
          <CardTitle className="text-2xl font-headline mb-2">
            {produto.nome}
          </CardTitle>

          <CardDescription className="text-muted-foreground text-sm mb-2 h-16 overflow-y-auto">
            {produto.descricao}
          </CardDescription>

          {/* PREÇO -------------------------------------------------- */}
          <div className="min-h-[28px] flex items-center">
            {isPizzaBaseSemPrecoVisivel ? (
              <span />
            ) : isComboOuPizzaCustomComPrecoBase ? (
              <p className="text-muted-foreground text-sm">
                A partir de:{" "}
                <span className="font-bold text-primary">
                  R$ {precoBase.toFixed(2).replace(".", ",")}
                </span>
              </p>
            ) : mostrarPrecoOferta ? (
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-primary">
                  R$ {precoPromo.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-sm text-muted-foreground line-through">
                  R$ {precoBase.toFixed(2).replace(".", ",")}
                </p>
              </div>
            ) : (
              <p className="text-xl font-bold text-primary">
                R$ {precoBase.toFixed(2).replace(".", ",")}
              </p>
            )}
          </div>
        </CardContent>

        {/* BOTÃO --------------------------------------------------- */}
        <CardFooter className="p-6 pt-0">
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    onClick={handleButtonClick}
                    variant={buttonVariant}
                    className={buttonClassName}
                    disabled={buttonDisabled}
                  >
                    <DisplayButtonIcon className="mr-2 h-5 w-5" />
                    {displayButtonText}
                  </Button>
                </div>
              </TooltipTrigger>
              {tooltipMessage && (
                <TooltipContent>
                  <p>{tooltipMessage}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      {/* Modais --------------------------------------------------- */}
      {isMontavelPizza && (
        <PizzaCustomizationModal
          produto={produto}
          isOpen={isPizzaModalOpen}
          onOpenChange={setIsPizzaModalOpen}
        />
      )}

      {(hasProductOptions || isSimpleProductRequiringQuantityModal) && (
        <ProductCustomizationModal
          produto={produto}
          isOpen={isProductModalOpen}
          onOpenChange={setIsProductModalOpen}
          isSimpleProduct={isSimpleProductRequiringQuantityModal}
        />
      )}
    </>
  );
}
