
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ProdutoAdmin, GrupoOpcional, ItemOpcional, OpcionalSelecionadoCarrinho } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/hooks/use-cart';
import { toast } from "@/hooks/use-toast";
import { PackagePlus, ShoppingBasket, MessageSquareText, MinusCircle, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface ProductCustomizationModalProps {
  produto: ProdutoAdmin;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isSimpleProduct?: boolean; // New prop
}

export function ProductCustomizationModal({ produto, isOpen, onOpenChange, isSimpleProduct = false }: ProductCustomizationModalProps) {
  const { addToCart, isShopOpen, shopStatusMessage } = useCart();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const [itemQuantity, setItemQuantity] = useState(1);
  const [observacoesItem, setObservacoesItem] = useState('');

  const grupoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observacoesSectionRef = useRef<HTMLDivElement>(null);
  const [lastFocusedGroupIndex, setLastFocusedGroupIndex] = useState(-1);
  const prevSelectedOptions = useRef<typeof selectedOptions>({});

  const hasGruposOpcionais = !isSimpleProduct && produto.gruposDeOpcionais && produto.gruposDeOpcionais.length > 0;

  const initializeSelections = useCallback(() => {
    const initialSelections: Record<string, string | string[]> = {};
    if (hasGruposOpcionais) {
      produto.gruposDeOpcionais?.forEach(grupo => {
        if (grupo.tipo_selecao === 'RADIO_OBRIGATORIO') {
          const defaultItem = grupo.itens.find(item => item.default_selecionado) || grupo.itens[0];
          if (defaultItem) {
              initialSelections[grupo.id] = defaultItem.id;
          }
        } else {
          initialSelections[grupo.id] = grupo.itens.filter(item => item.default_selecionado).map(item => item.id);
        }
      });
    }
    setSelectedOptions(initialSelections);
    setItemQuantity(1);
    setObservacoesItem('');
    prevSelectedOptions.current = initialSelections;
  }, [produto.gruposDeOpcionais, hasGruposOpcionais]);

  useEffect(() => {
    if (isOpen) {
      initializeSelections();
      setLastFocusedGroupIndex(-1);
    }
  }, [isOpen, initializeSelections]);

  useEffect(() => {
    if (produto.gruposDeOpcionais && !isSimpleProduct) {
      grupoRefs.current = grupoRefs.current.slice(0, produto.gruposDeOpcionais.length);
    } else {
      grupoRefs.current = [];
    }
  }, [produto.gruposDeOpcionais, isSimpleProduct]);

  useEffect(() => {
    if (!produto.gruposDeOpcionais || !isOpen || Object.keys(prevSelectedOptions.current).length === 0 || !hasGruposOpcionais || isSimpleProduct) return;
  
    let changedGroupIndex = -1;
  
    for (let i = 0; i < produto.gruposDeOpcionais.length; i++) {
      const grupoId = produto.gruposDeOpcionais[i].id;
      if (JSON.stringify(selectedOptions[grupoId]) !== JSON.stringify(prevSelectedOptions.current[grupoId])) {
        changedGroupIndex = i;
        break;
      }
    }
    
    prevSelectedOptions.current = JSON.parse(JSON.stringify(selectedOptions)); 
  
    if (changedGroupIndex !== -1) {
      const changedGroup = produto.gruposDeOpcionais[changedGroupIndex];
      const selection = selectedOptions[changedGroup.id];
      const isLastGroup = changedGroupIndex === produto.gruposDeOpcionais.length - 1;
  
      if (
        changedGroup.tipo_selecao === 'RADIO_OBRIGATORIO' &&
        selection && typeof selection === 'string' && selection !== '' &&
        changedGroupIndex === lastFocusedGroupIndex + 1
      ) {
        if (!isLastGroup && grupoRefs.current[changedGroupIndex + 1]) {
            grupoRefs.current[changedGroupIndex + 1]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setLastFocusedGroupIndex(changedGroupIndex + 1); 
        } else if (isLastGroup && observacoesSectionRef.current) {
            observacoesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setLastFocusedGroupIndex(changedGroupIndex + 1);
        }
      }
    }
  }, [selectedOptions, produto.gruposDeOpcionais, isOpen, lastFocusedGroupIndex, hasGruposOpcionais, isSimpleProduct]);


  const handleRadioChange = (grupoId: string, itemId: string) => {
    setSelectedOptions(prev => ({ ...prev, [grupoId]: itemId }));
  };

  const handleCheckboxChange = (grupoId: string, itemId: string, checked: boolean) => {
    const grupo = produto.gruposDeOpcionais?.find(g => g.id === grupoId);
    if (!grupo) return;

    const currentSelection = (selectedOptions[grupoId] as string[] || []);
    let newSelection: string[];

    if (itemId === 'acomp_nenhum') { 
      newSelection = checked ? [itemId] : [];
    } else {
      let tempSelection = checked
        ? [...currentSelection.filter(id => id !== 'acomp_nenhum'), itemId]
        : currentSelection.filter(id => id !== itemId);
      
      if (grupo.max_selecoes && tempSelection.length > grupo.max_selecoes) {
        toast({ title: "Limite Atingido", description: `Você pode selecionar no máximo ${grupo.max_selecoes} ${grupo.nome.toLowerCase()}.`, variant: "default" });
        return; 
      }
      newSelection = tempSelection;
    }
    setSelectedOptions(prev => ({ ...prev, [grupoId]: newSelection }));
  };

  const calculatedPrice = useMemo(() => {
    let price = produto.preco_base;
    if (hasGruposOpcionais) {
      produto.gruposDeOpcionais?.forEach(grupo => {
        const selection = selectedOptions[grupo.id];
        if (selection) {
          if (Array.isArray(selection)) { 
            selection.forEach(itemId => {
              const item = grupo.itens.find(i => i.id === itemId);
              if (item) price += item.preco_adicional;
            });
          } else { 
            const item = grupo.itens.find(i => i.id === selection);
            if (item) price += item.preco_adicional;
          }
        }
      });
    }
    return price * itemQuantity;
  }, [selectedOptions, produto, itemQuantity, hasGruposOpcionais]);
  
  const handleQuantityChange = (change: number) => {
    const maxQuantity = isSimpleProduct ? 5 : 10; // Max 5 for simple, 10 for others (can be adjusted)
    setItemQuantity(prev => {
      const newQuantity = prev + change;
      if (newQuantity < 1) return 1;
      if (newQuantity > maxQuantity) return maxQuantity;
      return newQuantity;
    });
  };

  const handleAddToCart = () => {
    if (!isShopOpen) {
      toast({ title: "Loja Fechada", description: shopStatusMessage, variant: "destructive" });
      onOpenChange(false);
      return;
    }

    const opcionaisParaCarrinho: OpcionalSelecionadoCarrinho[] = [];
    let formIsValid = true;
    let validationMessages: string[] = [];

    if (hasGruposOpcionais) {
      produto.gruposDeOpcionais?.forEach(grupo => {
        const selection = selectedOptions[grupo.id];
        
        if (grupo.tipo_selecao === 'RADIO_OBRIGATORIO') {
          if (!selection && grupo.itens.length > 0 && !grupo.itens.find(it => it.id === 'refri_nenhum')) {
            formIsValid = false;
            validationMessages.push(`Selecione uma opção para ${grupo.nome}.`);
          } else if (selection) {
            const item = grupo.itens.find(i => i.id === selection);
            if (item && !(item.id === 'refri_nenhum' && item.preco_adicional === 0) ) {
              opcionaisParaCarrinho.push({
                grupo_id: grupo.id,
                grupo_nome: grupo.nome,
                item_id: item.id,
                item_nome: item.nome,
                item_preco_adicional: item.preco_adicional,
                quantidade: 1 
              });
            }
          }
        } else if (grupo.tipo_selecao === 'CHECKBOX_OPCIONAL_MULTI' || grupo.tipo_selecao === 'CHECKBOX_OBRIGATORIO_MULTI') {
          const currentSelectionArray = (selection as string[] || []);
          const actualItemsSelected = currentSelectionArray.filter(id => id !== 'acomp_nenhum');

          if (grupo.tipo_selecao === 'CHECKBOX_OBRIGATORIO_MULTI') {
            if (actualItemsSelected.length === 0 && !currentSelectionArray.includes('acomp_nenhum')) {
               if (grupo.min_selecoes && grupo.min_selecoes > 0 && !grupo.itens.find(it => it.id === 'acomp_nenhum')) {
                   formIsValid = false;
                   validationMessages.push(`Selecione pelo menos ${grupo.min_selecoes} item(ns) para ${grupo.nome}.`);
               }
            } else if (grupo.min_selecoes && actualItemsSelected.length > 0 && actualItemsSelected.length < grupo.min_selecoes) {
               formIsValid = false;
               validationMessages.push(`Selecione pelo menos ${grupo.min_selecoes} item(ns) para ${grupo.nome}.`);
            }
          }
          
          if (grupo.max_selecoes && actualItemsSelected.length > grupo.max_selecoes) {
              formIsValid = false;
              validationMessages.push(`Selecione no máximo ${grupo.max_selecoes} item(ns) para ${grupo.nome}.`);
          }

          actualItemsSelected.forEach(itemId => {
            const item = grupo.itens.find(i => i.id === itemId);
            if (item) {
              opcionaisParaCarrinho.push({
                grupo_id: grupo.id,
                grupo_nome: grupo.nome,
                item_id: item.id,
                item_nome: item.nome,
                item_preco_adicional: item.preco_adicional,
                quantidade: 1
              });
            }
          });
          if (currentSelectionArray.includes('acomp_nenhum') && actualItemsSelected.length === 0) {
               const itemNenhum = grupo.itens.find(i => i.id === 'acomp_nenhum');
               if (itemNenhum && !(itemNenhum.id === 'acomp_nenhum' && itemNenhum.preco_adicional === 0)) {
                  opcionaisParaCarrinho.push({
                      grupo_id: grupo.id,
                      grupo_nome: grupo.nome,
                      item_id: itemNenhum.id,
                      item_nome: itemNenhum.nome,
                      item_preco_adicional: itemNenhum.preco_adicional,
                      quantidade: 1
                  });
               }
          }
        }
      });
    }


    if (!formIsValid) {
      toast({ title: "Seleção Inválida", description: validationMessages.join(' '), variant: "destructive" });
      return;
    }
    
    addToCart(
        produto, 
        itemQuantity, 
        undefined, // Adicionais de cobertura não são gerenciados aqui
        undefined, // sabor1Id não é gerenciado aqui
        undefined, // sabor2Id não é gerenciado aqui
        undefined, // bordaId não é gerenciado aqui
        (hasGruposOpcionais && opcionaisParaCarrinho.length > 0) ? opcionaisParaCarrinho : undefined, 
        (!isSimpleProduct && observacoesItem.trim()) ? observacoesItem.trim() : undefined
    );
    toast({
      title: "Produto Adicionado!",
      description: `${itemQuantity}x ${produto.nome} ${opcionaisParaCarrinho.length > 0 || (!isSimpleProduct && observacoesItem.trim()) ? 'com suas escolhas foi' : ''} adicionado ao carrinho.`,
    });
    
    onOpenChange(false); 
  };

  const modalTitle = isSimpleProduct ? `Adicionar ${produto.nome}` : (hasGruposOpcionais ? `Personalizar ${produto.nome}` : `Adicionar ${produto.nome}`);
  const modalDescription = isSimpleProduct 
    ? `Selecione a quantidade desejada para ${produto.nome}.` 
    : (hasGruposOpcionais 
        ? `${produto.descricao || ''} Configure os adicionais para o seu item.`
        : `${produto.descricao || ''} Abaixo você pode adicionar alguma observação para o preparo.`);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <ShoppingBasket className="mr-3 h-7 w-7 text-primary" />
            {modalTitle}
          </DialogTitle>
          <DialogDescription>
            {modalDescription}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-1 pr-3">
          <div className="space-y-6 py-4">
            {hasGruposOpcionais && produto.gruposDeOpcionais?.map((grupo, index) => (
              <div key={grupo.id} ref={el => grupoRefs.current[index] = el} className="space-y-3 border-t pt-4 first:border-t-0">
                <Label className="text-lg font-semibold text-primary">{grupo.nome}</Label>
                {grupo.instrucao && <p className="text-sm text-muted-foreground">{grupo.instrucao}</p>}
                
                {grupo.tipo_selecao === 'RADIO_OBRIGATORIO' && (
                  <RadioGroup
                    value={selectedOptions[grupo.id] as string || ''}
                    onValueChange={(value) => handleRadioChange(grupo.id, value)}
                  >
                    {grupo.itens.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/30 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                        <RadioGroupItem value={item.id} id={`${grupo.id}-${item.id}`} />
                        <Label htmlFor={`${grupo.id}-${item.id}`} className="flex-grow cursor-pointer text-sm">
                          {item.nome}
                          {item.preco_adicional > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">(+R$ {item.preco_adicional.toFixed(2).replace('.',',')})</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {(grupo.tipo_selecao === 'CHECKBOX_OPCIONAL_MULTI' || grupo.tipo_selecao === 'CHECKBOX_OBRIGATORIO_MULTI') && (
                  <div className="space-y-2">
                    {grupo.itens.map((item) => {
                      const isChecked = (selectedOptions[grupo.id] as string[] || []).includes(item.id);
                      const isNaoQueroAcomp = item.id === 'acomp_nenhum'; // Específico para não selecionar nada
                      const outrosAcompsSelecionados = (selectedOptions[grupo.id] as string[] || []).some(id => id !== 'acomp_nenhum');

                      return (
                        <div key={item.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/30 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                          <Checkbox
                            id={`${grupo.id}-${item.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleCheckboxChange(grupo.id, item.id, !!checked)}
                            disabled={isNaoQueroAcomp && outrosAcompsSelecionados}
                          />
                          <Label htmlFor={`${grupo.id}-${item.id}`} className={`flex-grow cursor-pointer text-sm ${isNaoQueroAcomp && outrosAcompsSelecionados ? 'text-muted-foreground line-through' : ''}`}>
                            {item.nome}
                            {item.preco_adicional > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">(+R$ {item.preco_adicional.toFixed(2).replace('.',',')})</span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            
            {!isSimpleProduct && (
                <div ref={observacoesSectionRef} className={`space-y-3 ${hasGruposOpcionais ? 'pt-4 border-t' : 'pt-0'}`}>
                <Label htmlFor="observacoesProduto" className="text-base font-semibold flex items-center">
                    <MessageSquareText className="mr-2 h-5 w-5 text-primary" />
                    Algum comentário?
                </Label>
                <Textarea
                    id="observacoesProduto"
                    placeholder="Ex: Sem picles, ponto da carne, etc."
                    value={observacoesItem}
                    onChange={(e) => setObservacoesItem(e.target.value)}
                    className="min-h-[60px]"
                />
                </div>
            )}
          </div>
        </ScrollArea>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center mb-4">
            <Label htmlFor="itemQuantity" className="text-md font-semibold">Quantidade:</Label>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={itemQuantity <= 1}
                    aria-label="Diminuir quantidade"
                >
                    <MinusCircle className="h-4 w-4" />
                </Button>
                <Input
                    id="itemQuantity"
                    type="number"
                    className="h-8 w-14 text-center text-md font-medium p-0"
                    value={itemQuantity}
                    readOnly
                    aria-label="Quantidade atual"
                />
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(1)}
                    disabled={itemQuantity >= (isSimpleProduct ? 5 : 10) }
                    aria-label="Aumentar quantidade"
                >
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </div>
        </div>

        <DialogFooter className="sm:justify-between items-center pt-4 border-t mt-2">
          <div className="text-xl font-bold text-primary">
            Total: R$ {calculatedPrice.toFixed(2).replace('.',',')}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={handleAddToCart}
              disabled={!isShopOpen}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <PackagePlus className="mr-2 h-5 w-5" /> Adicionar ao Carrinho
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
