
"use client";

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart, AlertTriangle, Truck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function StickyTotal() {
  const { totalAmount, totalItems, isShopOpen, shopStatusMessage, frete, contactInfo, getBairroById } = useCart();
  const pathname = usePathname();

  if (totalItems === 0 || pathname === '/checkout' || pathname === '/confirmation') {
    return null;
  }
  
  const bairroNome = contactInfo?.tipoEntrega === 'entrega' && contactInfo.bairroId ? getBairroById(contactInfo.bairroId)?.nome : 'Retirada';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-2xl p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{totalItems} item(s) no carrinho</p>
          <p className="text-xs text-muted-foreground flex items-center">
            <Truck className="mr-1 h-3 w-3" />
            Entrega ({bairroNome}): R$ {frete.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-2xl font-bold text-primary">Total: R$ {totalAmount.toFixed(2).replace('.', ',')}</p>
        </div>
        {isShopOpen ? (
          <Link href="/checkout">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ir para o Checkout
            </Button>
          </Link>
        ) : (
          <div className="text-right">
            <Alert variant="default" className="bg-amber-50 border-amber-300 text-amber-700 inline-block p-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 !text-amber-600" />
                    <AlertDescription className="text-sm text-center">
                        {shopStatusMessage}
                    </AlertDescription>
                </div>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
