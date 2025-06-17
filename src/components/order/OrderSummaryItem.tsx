
"use client";

import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import { generateCartItemId } from '@/context/CartContext';
import { MinusCircle, PlusCircle, Trash2, MessageSquareText } from 'lucide-react';

interface OrderSummaryItemProps {
  item: CartItem;
}

export function OrderSummaryItem({ item }: OrderSummaryItemProps) {
  const { updateQuantity, removeFromCart, getSaborById, getBordaById } = useCart();
  const cartItemId = generateCartItemId(item.produto.id, item.adicionais, item.sabor1Id, item.sabor2Id, item.bordaId, item.opcionaisSelecionados);

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = () => {
    removeFromCart(cartItemId);
  };

  let itemPrice = 0;
  const produto = item.produto; 
  const isGrande = produto.available_sizes?.includes('Grande');

  if (produto.is_personalizable_pizza && item.sabor1Id) {
    const sabor1 = getSaborById(item.sabor1Id);
    if (sabor1) {
      if (item.sabor1Id === item.sabor2Id) { 
        itemPrice = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
      } else if (item.sabor2Id && item.sabor1Id !== item.sabor2Id) { 
        const sabor2 = getSaborById(item.sabor2Id);
        if (sabor2) {
          const precoSabor1 = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
          const precoSabor2 = isGrande ? sabor2.preco_grande : sabor2.preco_pequena;
          itemPrice = (precoSabor1 / 2) + (precoSabor2 / 2);
        } else { 
          itemPrice = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
        }
      } else { 
        itemPrice = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
      }
    }
    if (item.bordaId) {
      const bordaItem = getBordaById(item.bordaId);
      if (bordaItem) {
        // Borda has preco_pequena and preco_grande directly
        const precoBordaAdicional = isGrande ? (bordaItem.preco_grande ?? 0) : (bordaItem.preco_pequena ?? 0);
        if (precoBordaAdicional > 0) itemPrice += precoBordaAdicional;
      }
    }
  } else {
     itemPrice = produto.preco_promocional && produto.preco_promocional > 0 
      ? produto.preco_promocional 
      : produto.preco_base;
  }
  
  const precoAdicionaisCobertura = item.adicionais?.reduce((sum, ad) => sum + ad.preco * ad.quantidade, 0) || 0;
  itemPrice += precoAdicionaisCobertura;

  const precoOpcionaisSelecionados = item.opcionaisSelecionados?.reduce((sum, op) => {
    return sum + (op.item_preco_adicional * op.quantidade); 
  }, 0) || 0;
  itemPrice += precoOpcionaisSelecionados;
  
  const precoTotalItem = itemPrice * item.quantity;

  const sabor1Display = item.sabor1Id ? getSaborById(item.sabor1Id) : null;
  const sabor2Display = item.sabor2Id ? getSaborById(item.sabor2Id) : null;
  const bordaDisplay = item.bordaId ? getBordaById(item.bordaId) : null;
  
  let bordaDisplayPrice = 0;
  if (bordaDisplay) {
    // Borda has preco_pequena and preco_grande directly
    bordaDisplayPrice = isGrande ? (bordaDisplay.preco_grande ?? 0) : (bordaDisplay.preco_pequena ?? 0);
  }


  return (
    <div className="py-4 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-grow min-w-0">
          <div className="flex-grow min-w-0">
            <h4 className="font-semibold break-words">{produto.nome}</h4>
            <p className="text-sm text-muted-foreground">
              Unidade: R$ {itemPrice.toFixed(2).replace('.', ',')}
            </p>
            {produto.is_personalizable_pizza && sabor1Display && (
              <>
                {sabor1Display.id === sabor2Display?.id ? (
                  <p className="text-xs text-muted-foreground">
                    Sabor: {sabor1Display.nome} (Inteira)
                  </p>
                ) : (
                  sabor2Display && <p className="text-xs text-muted-foreground">
                    Sabores: {sabor1Display.nome} / {sabor2Display.nome}
                  </p>
                )}
              </>
            )}
            {bordaDisplay && bordaDisplay.id !== 'borda-nenhuma' && bordaDisplayPrice > 0 && ( 
              <p className="text-xs text-muted-foreground">
                Borda: {bordaDisplay.nome} (+R$ {bordaDisplayPrice.toFixed(2).replace('.', ',')})
              </p>
            )}
            {item.adicionais && item.adicionais.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Adicionais Cobertura:
                <ul className="list-disc list-inside ml-1">
                  {item.adicionais.map(ad => (
                    <li key={ad.id}>
                      {ad.quantidade}x {ad.nome} (+R$ {(ad.preco * ad.quantidade).toFixed(2).replace('.', ',')})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.opcionaisSelecionados && item.opcionaisSelecionados.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Opcionais:
                <ul className="list-disc list-inside ml-1">
                  {item.opcionaisSelecionados.map(op => (
                    <li key={`${op.grupo_id}-${op.item_id}`}>
                      {op.grupo_nome}: {op.item_nome} 
                      {op.item_preco_adicional > 0 && ` (+R$ ${(op.item_preco_adicional * op.quantidade).toFixed(2).replace('.', ',')})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
             {item.observacoesItem && (
              <div className="text-xs text-muted-foreground mt-1 flex items-start">
                <MessageSquareText className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                <span>Obs: {item.observacoesItem}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-x-0.5 sm:gap-x-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            aria-label="Diminuir quantidade"
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <MinusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 0)}
            className="w-10 text-center h-7 text-sm p-0 sm:h-8"
            aria-label="Quantidade do item"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            aria-label="Aumentar quantidade"
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive/80 h-7 w-7 sm:h-8 sm:w-8"
            onClick={handleRemoveItem}
            aria-label="Remover item"
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <p className="font-semibold text-right min-w-[4rem] sm:min-w-[4.5rem] whitespace-nowrap pl-1 sm:pl-2">
            R$ {precoTotalItem.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
    </div>
  );
}

