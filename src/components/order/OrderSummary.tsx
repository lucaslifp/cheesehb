
"use client";

import { useCart } from '@/hooks/use-cart';
import { OrderSummaryItem } from './OrderSummaryItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, AlertTriangle, Truck } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateCartItemId } from '@/context/CartContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { BairroEntrega } from '@/types'; // Usar BairroEntrega
import { useMemo } from 'react';

export function OrderSummary() {
  const { 
    cartItems, 
    subtotal, 
    frete, 
    totalAmount, 
    clearCart, 
    totalItems, 
    upsoldItem, 
    isShopOpen, 
    shopStatusMessage, 
    contactInfo, 
    updateContactInfo, 
    getBairroById,
    bairrosEntrega // Obter bairros do contexto
  } = useCart();

  const handleBairroChange = (bairroId: string | null) => {
    if (bairroId && bairroId !== "retirada") {
      updateContactInfo({ bairroId, tipoEntrega: 'entrega' });
    } else {
      updateContactInfo({ bairroId: null, tipoEntrega: 'retirada' });
    }
  };

  if (totalItems === 0 && !upsoldItem) {
    return (
      <Card className="sticky top-24 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Seu Carrinho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Seu carrinho está vazio. Adicione alguns itens deliciosos!</p>
          {!isShopOpen && shopStatusMessage && (
            <Alert variant="default" className="mt-4 bg-amber-50 border-amber-300 text-amber-700">
              <AlertTriangle className="h-4 w-4 !text-amber-600" />
              <AlertDescription className="text-sm">
                {shopStatusMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  const bairrosDisponiveis: BairroEntrega[] = useMemo(() => 
    bairrosEntrega.filter(b => b.ativo), 
    [bairrosEntrega]
  );

  return (
    <Card className="sticky top-24 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Seu Pedido
          </div>
          { (cartItems.length > 0 || upsoldItem) && (
            <Button variant="outline" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive/90 border-destructive hover:border-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" /> Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[40vh] overflow-y-auto pr-2">
        {cartItems.map((item) => (
          <OrderSummaryItem key={generateCartItemId(item.produto.id, item.adicionais, item.sabor1Id, item.sabor2Id, item.bordaId, item.opcionaisSelecionados)} item={item} />
        ))}
        {upsoldItem && (
          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <h4 className="font-semibold">{upsoldItem.name} (Sugestão IA)</h4>
              <p className="text-sm text-muted-foreground">R$ {upsoldItem.price.toFixed(2).replace('.', ',')}</p>
            </div>
            <p className="font-semibold">R$ {upsoldItem.price.toFixed(2).replace('.', ',')}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-4">
        <div className="w-full space-y-2 mb-2">
          <Label htmlFor="bairro-select-summary" className="text-sm font-medium flex items-center">
            <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
            Entrega ou Retirada:
          </Label>
          <Select
            value={contactInfo?.bairroId || "retirada"}
            onValueChange={(value) => handleBairroChange(value === "retirada" ? null : value)}
          >
            <SelectTrigger id="bairro-select-summary" className="w-full">
              <SelectValue placeholder="Selecione o bairro ou retirada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retirada">Retirar na loja (Sem taxa)</SelectItem>
              {bairrosDisponiveis.map(bairro => (
                <SelectItem key={bairro.id} value={bairro.id}>
                  {bairro.nome} (+ R$ {bairro.taxa_entrega.toFixed(2).replace('.', ',')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-1" />

        <div className="w-full flex justify-between text-lg">
          <span>Subtotal:</span>
          <span className="font-semibold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="w-full flex justify-between text-md text-muted-foreground">
          <span>Entrega ({contactInfo?.tipoEntrega === 'entrega' && contactInfo.bairroId ? getBairroById(contactInfo.bairroId)?.nome : 'Retirada'}):</span>
          <span className="font-semibold">R$ {frete.toFixed(2).replace('.', ',')}</span>
        </div>
        <Separator className="my-2" />
        <div className="w-full flex justify-between text-xl font-bold text-primary">
          <span>Total:</span>
          <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
        </div>
        
        {isShopOpen && totalItems > 0 && (
          <Link href="/checkout" className="w-full mt-4">
            <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Ir para o Checkout
            </Button>
          </Link>
        )}
        {!isShopOpen && shopStatusMessage && (
          <Alert variant="default" className="mt-4 w-full bg-amber-50 border-amber-300 text-amber-700">
            <AlertTriangle className="h-5 w-5 !text-amber-600" />
            <AlertDescription className="text-center">
              {shopStatusMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
