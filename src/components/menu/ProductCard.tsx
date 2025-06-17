
"use client";

import Image from 'next/image';
import type { Database } from '@/types/supabase'; // Using Supabase generated types
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { toast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Settings2, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { PizzaCustomizationModal } from './PizzaCustomizationModal';
import { ProductCustomizationModal } from './ProductCustomizationModal';

type ProdutoFromDB = Database["public"]["Tables"]["produtos"]["Row"];

interface ProductCardProps {
  produto: ProdutoFromDB;
}

// Categories that allow direct adding to cart if product has no options
// TODO: Update with actual DB IDs for categories like 'Bebidas'
const CATEGORIAS_DIRETO_CARRINHO_SEM_OPCOES_IDS = ['cat1-bebidas-mock']; 

export function ProductCard({ produto }: ProductCardProps) {
  const { addToCart, isShopOpen, shopStatusMessage } = useCart();
  const [isPizzaModalOpen, setIsPizzaModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const isMontavelPizza = produto.is_personalizable_pizza === true;
  const hasProductOptions = produto.grupos_opcionais_ids && produto.grupos_opcionais_ids.length > 0;
  
  const isCategoriaDiretoCarrinho = produto.categoria_id
    ? CATEGORIAS_DIRETO_CARRINHO_SEM_OPCOES_IDS.includes(produto.categoria_id)
    : false;
  
  // True if it's a simple product (not pizza, no options) that needs the quantity modal (not a direct-add category)
  const isSimpleProductRequiringQuantityModal = !isMontavelPizza && !hasProductOptions && !isCategoriaDiretoCarrinho;

  const handleButtonClick = () => {
    if (!isShopOpen) {
      toast({
        title: "Loja Fechada",
        description: shopStatusMessage,
        variant: "destructive",
      });
      return;
    }

    if (isMontavelPizza) {
      setIsPizzaModalOpen(true);
    } else if (hasProductOptions || isSimpleProductRequiringQuantityModal) {
      setIsProductModalOpen(true);
    } else { 
      addToCart(produto, 1);
      toast({
        title: "Produto Adicionado!",
        description: `${produto.nome} foi adicionado ao seu carrinho.`,
      });
    }
  };

  let displayButtonText: string;
  let DisplayButtonIcon: React.ElementType;
  let buttonVariant: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link" = "default";
  let buttonClassName: string = "w-full bg-accent hover:bg-accent/90 text-accent-foreground";
  let buttonDisabled: boolean = false;
  let tooltipMessage: string | null = null;

  if (!isShopOpen) {
    displayButtonText = "Loja Fechada";
    DisplayButtonIcon = Clock;
    buttonVariant = "outline";
    buttonClassName = "w-full text-muted-foreground border-muted-foreground/30 hover:bg-transparent hover:text-muted-foreground cursor-not-allowed";
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
  
  const precoBaseFinal = produto.preco_base ?? 0;
  const precoPromocionalFinal = produto.preco_promocional ?? 0;

  const isPizzaBaseSemPrecoVisivel = isMontavelPizza && (produto.preco_base == null || produto.preco_base === 0);
  const isComboOuPizzaCustomComPrecoBase = hasProductOptions || (isMontavelPizza && produto.preco_base != null && produto.preco_base > 0);
  
  const mostrarPrecoOferta = 
    !isPizzaBaseSemPrecoVisivel && 
    !isComboOuPizzaCustomComPrecoBase && 
    precoPromocionalFinal > 0 && 
    precoPromocionalFinal < precoBaseFinal;

  return (
    <>
      <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
        <CardHeader className="p-0">
          <div className="aspect-[3/2] relative w-full">
            <Image
              src={produto.imagem_url || 'https://placehold.co/300x200.png'}
              alt={produto.nome}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={produto.image_hint || "product image"}
            />
            {mostrarPrecoOferta && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                OFERTA!
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-grow">
          <CardTitle className="text-2xl font-headline mb-2">{produto.nome}</CardTitle>
          <CardDescription className="text-muted-foreground text-sm mb-2 h-16 overflow-y-auto">{produto.descricao}</CardDescription>

          {produto.ingredientes && produto.ingredientes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Ingredientes:</p>
              <p className="text-xs text-muted-foreground">
                {produto.ingredientes.join(', ')}
              </p>
            </div>
          )}
          
          <div className="min-h-[28px] flex items-center"> {/* Ensure consistent height */}
            {isPizzaBaseSemPrecoVisivel ? (
              <div /> // Rule B.1: No price displayed
            ) : isComboOuPizzaCustomComPrecoBase ? (
              // Rule B.2: Display "A partir de"
              <p className="text-muted-foreground text-sm">
                A partir de: <span className="font-bold text-primary">R$ {Number(produto.preco_base).toFixed(2).replace('.',',')}</span>
              </p>
            ) : mostrarPrecoOferta ? (
              // Simple product with offer
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-primary">
                  R$ {precoPromocionalFinal.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-muted-foreground line-through">
                  R$ {precoBaseFinal.toFixed(2).replace('.', ',')}
                </p>
              </div>
            ) : (
              // Simple product, regular price
              <p className="text-xl font-bold text-primary">
                R$ {Number(precoBaseFinal).toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>
        </CardContent>
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
                    aria-disabled={buttonDisabled}
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
