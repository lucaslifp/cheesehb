
"use client";

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/checkout/ContactForm';
import { AiUpsell } from '@/components/checkout/AiUpsell';
import { useCart } from '@/hooks/use-cart';
import { generateCartItemId } from '@/context/CartContext';
import type { ContactInfo as ContactInfoType, CartItem as CartItemType, CriarPedidoPayload } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, AlertTriangle, Clock, Truck, MessageSquareText, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";


export default function CheckoutPage() {
  const router = useRouter();
  const {
    cartItems,
    subtotal,
    frete, 
    totalAmount,
    contactInfo,
    updateContactInfo,
    totalItems,
    upsoldItem,
    isShopOpen,
    shopStatusMessage,
    getSaborById,
    getBordaById,
    getBairroById,
  } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleContactFormChange = useCallback(
    (formData: Partial<ContactInfoType>) => {
      updateContactInfo(formData);
    },
    [updateContactInfo]
  );

  useEffect(() => {
    if (isClient && ((totalItems === 0 && !upsoldItem) || !isShopOpen)) {
      if (!isShopOpen) {
        toast({
            title: "Loja Fechada",
            description: shopStatusMessage,
            variant: "destructive",
            duration: 5000,
        });
      }
      router.replace('/');
    }
  }, [isClient, totalItems, upsoldItem, router, isShopOpen, shopStatusMessage]);


  const handleFormSubmit = async (data: ContactInfoType) => {
    if (!isShopOpen) {
       toast({
        title: "Loja Fechada",
        description: "Não é possível finalizar o pedido com a loja fechada.",
        variant: "destructive",
      });
      router.replace('/');
      return;
    }
    updateContactInfo(data); 
    setIsProcessing(true);
    
    const pedidoPayload: CriarPedidoPayload = {
        contactInfo: data,
        cartItems: cartItems,
        upsoldItem: upsoldItem,
        subtotal: subtotal,
        frete: frete,
        totalAmount: totalAmount,
    };

    try {
        const response = await fetch('/api/checkout/criar-pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoPayload),
        });

        if (!response.ok) {
            let errorDetail = "Falha ao criar o pedido.";
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                if (errorData && errorData.error) {
                    errorDetail = errorData.error;
                } else if (errorData && errorData.details) {
                    const details = errorData.details?.fieldErrors ? 
                        Object.entries(errorData.details.fieldErrors).map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`).join('; ')
                        : JSON.stringify(errorData.details);
                    errorDetail = `Dados inválidos: ${details}`;
                } else {
                  errorDetail = `Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
                }
            } catch (parseError) {
                errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
            }
            throw new Error(errorDetail);
        }
        
        const result = await response.json();
        
        const queryParams = new URLSearchParams({
            name: data.name,
            total: totalAmount.toFixed(2).replace('.', ','),
            itemsCount: (cartItems.reduce((sum, item) => sum + item.quantity, 0) + (upsoldItem ? 1 : 0)).toString(),
            order_number: result.order_number, // Usar order_number
            orderId: result.pedidoId, 
        }).toString();
        router.push(`/confirmation?${queryParams}`);

    } catch (error: any) {
        console.error("Erro ao finalizar pedido:", error);
        toast({
            title: "Erro ao Finalizar Pedido",
            description: error.message || "Não foi possível salvar seu pedido. Tente novamente.",
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  if (!isClient) {
    return null; 
  }
  
  if (!isShopOpen) { 
     return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-2xl font-headline">Loja Fechada</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground mb-4">{shopStatusMessage}</p>
                    <Button onClick={() => router.push('/')} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Cardápio
                    </Button>
                </CardContent>
            </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (totalItems === 0 && !upsoldItem) { 
     return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <p className="text-xl text-muted-foreground">Seu carrinho está vazio.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Ir para o Cardápio</Button>
      </div>
    );
  }

  const getItemDisplayPrice = (item: CartItemType): number => {
    let itemPrice = 0;

    if (item.produto.is_personalizable_pizza && item.sabor1Id) {
        const sabor1 = getSaborById(item.sabor1Id);
        if (sabor1) {
          if (item.sabor1Id === item.sabor2Id) { 
            itemPrice = item.produto.available_sizes?.includes('Grande') ? sabor1.preco_grande : sabor1.preco_pequena;
          } else if (item.sabor2Id && item.sabor1Id !== item.sabor2Id) { 
            const sabor2 = getSaborById(item.sabor2Id);
            if (sabor2) {
              const precoSabor1 = item.produto.available_sizes?.includes('Grande') ? sabor1.preco_grande : sabor1.preco_pequena;
              const precoSabor2 = item.produto.available_sizes?.includes('Grande') ? sabor2.preco_grande : sabor2.preco_pequena;
              itemPrice = (precoSabor1 / 2) + (precoSabor2 / 2);
            } else {
              itemPrice = item.produto.available_sizes?.includes('Grande') ? sabor1.preco_grande : sabor1.preco_pequena;
            }
          } else { 
            itemPrice = item.produto.available_sizes?.includes('Grande') ? sabor1.preco_grande : sabor1.preco_pequena;
          }
        }
        if (item.bordaId) {
          const borda = getBordaById(item.bordaId);
          if (borda) itemPrice += borda.preco_adicional;
        }
      } else {
        itemPrice = item.produto.preco_base;
      }
    
    const precoAdicionaisCobertura = item.adicionais?.reduce((sum, ad) => sum + ad.preco * ad.quantidade, 0) || 0;
    itemPrice += precoAdicionaisCobertura;

    const precoOpcionaisSelecionados = item.opcionaisSelecionados?.reduce((sum, op) => sum + (op.item_preco_adicional * op.quantidade), 0) || 0;
    itemPrice += precoOpcionaisSelecionados;
    
    return itemPrice * item.quantity;
  };

  const nomeBairroEntrega = contactInfo?.tipoEntrega === 'entrega' && contactInfo.bairroId 
    ? getBairroById(contactInfo.bairroId)?.nome 
    : 'Retirada';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.push('/')} className="mb-6" disabled={isProcessing}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Cardápio
        </Button>
        <h2 className="text-4xl font-headline font-bold mb-8 text-center">Checkout</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Informações e Pagamento</CardTitle>
                <CardDescription>Preencha seus dados, escolha como receber e a forma de pagamento.</CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm 
                  onSubmit={handleFormSubmit} 
                  initialData={contactInfo || { tipoEntrega: 'retirada', bairroId: null }} 
                  isLoading={isProcessing}
                  onFormChange={handleContactFormChange}
                />
              </CardContent>
            </Card>
            <AiUpsell />
          </div>

          <Card className="sticky top-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <ShoppingBag className="h-7 w-7 text-primary" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.map(item => {
                const totalItemPrice = getItemDisplayPrice(item);
                const sabor1 = item.sabor1Id ? getSaborById(item.sabor1Id) : null;
                const sabor2 = item.sabor2Id ? getSaborById(item.sabor2Id) : null;
                const borda = item.bordaId ? getBordaById(item.bordaId) : null;
                const itemId = generateCartItemId(item.produto.id, item.adicionais, item.sabor1Id, item.sabor2Id, item.bordaId, item.opcionaisSelecionados);

                return (
                  <div key={itemId} className="py-2 border-b last:border-b-0">
                    <div className="flex justify-between">
                      <span>{item.quantity}x {item.produto.nome}</span>
                      <span>R$ {totalItemPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {(sabor1 || borda || (item.adicionais && item.adicionais.length > 0) || (item.opcionaisSelecionados && item.opcionaisSelecionados.length > 0) || item.observacoesItem) && (
                       <ul className="text-xs text-muted-foreground ml-4 list-disc list-inside">
                        {sabor1 && (
                            sabor1.id === sabor2?.id ? (
                                <li>Sabor: {sabor1.nome} (Inteira)</li>
                            ) : (
                                sabor2 && <li>Sabores: {sabor1.nome} / {sabor2.nome}</li>
                            )
                        )}
                        {borda && borda.id !== 'borda-nenhuma' && (
                          <li>Borda: {borda.nome}</li>
                        )}
                        {item.adicionais && item.adicionais.length > 0 && (
                          <>
                            {item.adicionais.map(ad => (
                              <li key={ad.id}>{ad.quantidade}x {ad.nome} (+R$ {(ad.preco * ad.quantidade).toFixed(2).replace('.', ',')})</li>
                            ))}
                          </>
                        )}
                        {item.opcionaisSelecionados && item.opcionaisSelecionados.length > 0 && (
                            item.opcionaisSelecionados.map(op => (
                                <li key={`${op.grupo_id}-${op.item_id}`}>
                                    {op.grupo_nome}: {op.item_nome} 
                                    {op.item_preco_adicional > 0 ? ` (+R$ ${(op.item_preco_adicional * op.quantidade).toFixed(2).replace('.',',')})` : ''}
                                </li>
                            ))
                        )}
                        {item.observacoesItem && (
                           <li className="flex items-start">
                             <MessageSquareText className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-blue-600" />
                             Obs: {item.observacoesItem}
                           </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
              {upsoldItem && (
                 <div className="flex justify-between py-2 border-b text-green-600 font-semibold">
                  <span>1x {upsoldItem.name} (Oferta IA!)</span>
                  <span>R$ {upsoldItem.price.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <Separator className="my-3" />
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center"><Truck className="mr-1 h-4 w-4"/>Entrega ({nomeBairroEntrega}):</span>
                  <span>R$ {frete.toFixed(2).replace('.', ',')}</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Total:</span>
                  <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                </div>
                 {isProcessing && (
                    <div className="flex items-center justify-center pt-4">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span>Finalizando pedido...</span>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
