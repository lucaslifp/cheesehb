
"use client";

import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { upsellSuggestion, type UpsellSuggestionInput, type UpsellSuggestionOutput } from '@/ai/flows/upsell-suggestion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, PlusCircle, ShoppingBag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { UpsoldItem } from '@/types';

// Mock price for suggested items, as AI doesn't provide it
const SUGGESTED_ITEM_PRICE = 4.99;

export function AiUpsell() {
  const { cartItems, contactInfo, totalAmount, addUpsoldItem, upsoldItem: currentUpsoldItem, removeUpsoldItem, isShopOpen, shopStatusMessage } = useCart();
  const [suggestion, setSuggestion] = useState<UpsellSuggestionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isShopOpen && cartItems.length > 0 && contactInfo?.name && contactInfo?.phone && !currentUpsoldItem && !suggestion) {
      const fetchSuggestion = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const orderSummary = cartItems
            .map(item => `${item.quantity}x ${item.produto.nome}`) // Usando produto.nome
            .join(', ');

          const input: UpsellSuggestionInput = {
            userName: contactInfo.name,
            phoneNumber: contactInfo.phone,
            orderSummary,
            orderTotal: totalAmount,
            deliveryAddress: contactInfo.address,
          };
          const result = await upsellSuggestion(input);
          setSuggestion(result);
        } catch (err) {
          console.error("Erro ao buscar sugestão de upsell:", err);
          setError("Não foi possível buscar uma sugestão da IA no momento.");
        } finally {
          setIsLoading(false);
        }
      };
      const timer = setTimeout(fetchSuggestion, 1000);
      return () => clearTimeout(timer);
    } else if (!isShopOpen) {
        setSuggestion(null); 
    }
  }, [isShopOpen, cartItems, contactInfo, totalAmount, currentUpsoldItem, suggestion]);

  const handleAddSuggestion = () => {
    if (!isShopOpen) {
      toast({
        title: "Loja Fechada",
        description: shopStatusMessage,
        variant: "destructive",
      });
      return;
    }
    if (suggestion) {
      const newItem: UpsoldItem = { name: suggestion.suggestion, price: SUGGESTED_ITEM_PRICE };
      addUpsoldItem(newItem);
      toast({
        title: "Sugestão Adicionada!",
        description: `${suggestion.suggestion} foi adicionado ao seu pedido.`,
      });
      setSuggestion(null); 
    }
  };
  
  const handleRemoveSuggestion = () => {
    removeUpsoldItem();
     toast({
        title: "Sugestão Removida",
        description: `O item sugerido foi removido do seu pedido.`,
      });
  }

  if (!isShopOpen) {
    return null; 
  }

  if (isLoading) {
    return (
      <Card className="mt-8 bg-secondary/50 border-dashed border-accent">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center text-accent-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            IA pensando em algo especial...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nosso chef IA está buscando uma sugestão para você.</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !currentUpsoldItem) {
    return (
      <Alert variant="destructive" className="mt-8">
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Ops!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (currentUpsoldItem) {
     return (
       <Card className="mt-8 bg-green-50 border-green-500">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center text-green-700">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Adicionado ao Pedido!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">{currentUpsoldItem.name}</p>
          <p className="text-sm text-muted-foreground">Preço: R$ {currentUpsoldItem.price.toFixed(2).replace('.', ',')}</p>
        </CardContent>
        <CardFooter>
           <Button variant="outline" onClick={handleRemoveSuggestion} className="w-full">
            Remover Sugestão
          </Button>
        </CardFooter>
      </Card>
     )
  }

  if (!suggestion || cartItems.length === 0) {
    return null; 
  }

  return (
    <Card className="mt-8 bg-accent/10 border-accent shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center text-accent-foreground/90">
          <Lightbulb className="mr-2 h-5 w-5 text-accent" />
          Sugestão da IA Para Você!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{suggestion.suggestion}</p>
        <CardDescription className="mt-1">{suggestion.reason}</CardDescription>
        <p className="mt-2 font-medium text-primary">Adiciona apenas R$ {SUGGESTED_ITEM_PRICE.toFixed(2).replace('.', ',')}!</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleAddSuggestion} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar ao Pedido
        </Button>
      </CardFooter>
    </Card>
  );
}
