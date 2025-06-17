
"use client";

import { useEffect, useState, Suspense } from 'react'; 
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetOrder } = useCart();

  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [itemsCount, setItemsCount] = useState('');
  const [orderNumberDisplay, setOrderNumberDisplay] = useState(''); // Para exibir order_number
  const [orderId, setOrderId] = useState('');


  useEffect(() => {
    setName(searchParams.get('name') || 'Cliente Especial');
    setTotal(searchParams.get('total') || '0,00');
    setItemsCount(searchParams.get('itemsCount') || '0');
    setOrderNumberDisplay(searchParams.get('order_number') || 'Processando...'); // Usar 'order_number'
    setOrderId(searchParams.get('orderId') || '');

    resetOrder(); 
  }, [searchParams, resetOrder]);

  if (!name && !orderNumberDisplay) { // Checar por orderNumberDisplay
    return (
        <div className="flex flex-col min-h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Carregando confirmação...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-headline text-primary">Pedido Confirmado!</CardTitle>
            <CardDescription className="text-lg">
              Obrigado pelo seu pedido, {name}!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Seu pedido <strong className="text-primary">{orderNumberDisplay}</strong> está sendo preparado!
            </p>
            <p className="text-muted-foreground">
              Você pediu {itemsCount} item(ns).
            </p>
            <div className="p-4 bg-secondary rounded-md space-y-3">
              <div className="text-center">
                <div className="text-md font-semibold text-foreground">
                  Valor Total:
                </div>
                <p className="font-bold text-xl text-primary">R$ {total}</p>
              </div>
              {orderId && (
                  <p className="text-xs text-muted-foreground">ID do Pedido (Ref. Interna): {orderId}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Uma mensagem foi enviada para o seu número de WhatsApp se foi digitado corretamente no pedido (funcionalidade de envio de msg não implementada).
            </p>
            <Button size="lg" onClick={() => router.push('/')} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-6">
              <Package className="mr-2 h-5 w-5" /> Pedir Novamente
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col min-h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Carregando...</p>
        </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
