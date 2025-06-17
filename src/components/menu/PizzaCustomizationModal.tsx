
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ProdutoAdmin, SaborPizza, Borda, AdicionalPizza, AdicionalSelecionado, CategoriaAdmin } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/hooks/use-cart';
import { toast } from "@/hooks/use-toast";
import { Minus, Plus, Pizza, GlassWater, MinusCircle, PlusCircle, MessageSquareText } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface PizzaCustomizationModalProps {
  produto: ProdutoAdmin;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const BEBIDAS_CATEGORIA_NOME = "Bebidas"; 

export function PizzaCustomizationModal({ produto, isOpen, onOpenChange }: PizzaCustomizationModalProps) {
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
    categorias 
  } = useCart();

  const [flavorPortions, setFlavorPortions] = useState<Record<string, number>>({});
  const defaultBordaNaoQuero = useMemo(() => bordas.find(b => b.nome.toLowerCase().includes("não quero") || b.nome.toLowerCase().includes("sem borda")), [bordas]);
  const defaultBordaId = defaultBordaNaoQuero?.id || bordas[0]?.id || '';

  const [selectedBordaId, setSelectedBordaId] = useState<string>(defaultBordaId);
  const [selectedAdicionaisCobertura, setSelectedAdicionaisCobertura] = useState<AdicionalSelecionado[]>([]);
  const [selectedBebidas, setSelectedBebidas] = useState<AdicionalSelecionado[]>([]);
  const [observacoesItem, setObservacoesItem] = useState('');

  const isGrande = produto.available_sizes?.includes('Grande');

  const bordaSectionRef = useRef<HTMLDivElement>(null);
  const bebidasSectionRef = useRef<HTMLDivElement>(null);
  const adicionaisSectionRef = useRef<HTMLDivElement>(null);
  const observacoesSectionRef = useRef<HTMLDivElement>(null);
  const [hasScrolledAfterSabores, setHasScrolledAfterSabores] = useState(false);

  const saboresDisponiveis = useMemo(() => {
    if (!produto.tipo_pizza) return [];
    return sabores.filter(s => s.categoria_sabor.toLowerCase() === produto.tipo_pizza?.toLowerCase() && s.ativo);
  }, [sabores, produto.tipo_pizza]);

  const bordasDisponiveis = useMemo(() => {
    return bordas.filter(b => b.ativo);
  }, [bordas]);
  
  useEffect(() => {
    const newDefaultBordaId = defaultBordaNaoQuero?.id || bordas[0]?.id || '';
    if (newDefaultBordaId && newDefaultBordaId !== selectedBordaId) {
        setSelectedBordaId(newDefaultBordaId);
    }
  }, [bordas, defaultBordaNaoQuero, selectedBordaId]);

  const ingredientesAdicionaisDisponiveis = useMemo(() => adicionaisPizza.filter(ad => ad.ativo), [adicionaisPizza]);

  const bebidasDisponiveis: ProdutoAdmin[] = useMemo(() => {
    const categoriaBebidas = categorias.find(cat => cat.nome.toLowerCase() === BEBIDAS_CATEGORIA_NOME.toLowerCase());
    if (categoriaBebidas) {
      return produtos.filter(
        (p) => p.categoria_id === categoriaBebidas.id && p.ativo && p.mostrar_no_cardapio
      );
    }
    return [];
  }, [produtos, categorias]);

  const totalPortionsSelected = useMemo(() => {
    return Object.values(flavorPortions).reduce((sum, count) => sum + count, 0);
  }, [flavorPortions]);

  const handlePortionChange = useCallback((saborId: string, change: 1 | -1) => {
    setFlavorPortions(prev => {
      const currentFlavorPortion = prev[saborId] || 0;
      const newFlavorPortion = currentFlavorPortion + change;
      if (newFlavorPortion < 0 || newFlavorPortion > 2) return prev;
      const tempTotalPortions = Object.values(prev).reduce((sum, count) => sum + count, 0) - currentFlavorPortion + newFlavorPortion;
      if (tempTotalPortions > 2) {
        toast({ title: "Limite atingido", description: "Máximo 2 porções de sabores.", variant: "default" });
        return prev;
      }
      const updatedPortions = { ...prev, [saborId]: newFlavorPortion };
      if (updatedPortions[saborId] === 0) delete updatedPortions[saborId];
      return updatedPortions;
    });
  }, []);

  const calculatedPizzaPrice = useMemo(() => {
    let price = 0;
    const portionsArray = Object.entries(flavorPortions).filter(([, count]) => count > 0);
    if (portionsArray.length === 1 && portionsArray[0][1] === 2) { 
        const [saborId] = portionsArray[0];
        const sabor = getSaborById(saborId);
        if (sabor) price = isGrande ? sabor.preco_grande : sabor.preco_pequena;
    } else if (portionsArray.length === 2 && portionsArray[0][1] === 1 && portionsArray[1][1] === 1) { 
        const sabor1 = getSaborById(portionsArray[0][0]);
        const sabor2 = getSaborById(portionsArray[1][0]);
        if (sabor1 && sabor2) {
            const precoSabor1 = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
            const precoSabor2 = isGrande ? sabor2.preco_grande : sabor2.preco_pequena;
            price = (precoSabor1 / 2) + (precoSabor2 / 2);
        }
    } else if (portionsArray.length === 1 && portionsArray[0][1] === 1) { 
         const [saborId] = portionsArray[0];
         const sabor = getSaborById(saborId);
         if (sabor) price = (isGrande ? sabor.preco_grande : sabor.preco_pequena) / 2;
    }
    price += produto.preco_base || 0;
    return price;
  }, [flavorPortions, isGrande, getSaborById, produto.preco_base]);

  const calculatedTotalPrice = useMemo(() => {
    let price = calculatedPizzaPrice;
    const borda = selectedBordaId ? getBordaById(selectedBordaId) : null;
    if (borda) {
      // Borda now has preco_pequena and preco_grande directly
      const precoBordaAdicional = isGrande ? (borda.preco_grande ?? 0) : (borda.preco_pequena ?? 0);
      const bordaSemPreco = bordas.find(b => b.nome.toLowerCase().includes("não quero") || b.nome.toLowerCase().includes("sem borda"));
      if (borda.id !== bordaSemPreco?.id && precoBordaAdicional > 0) {
         price += precoBordaAdicional;
      }
    }
    selectedAdicionaisCobertura.forEach(ad => { price += ad.preco * ad.quantidade; });
    selectedBebidas.forEach(bebida => { price += bebida.preco * bebida.quantidade; });
    return price;
  }, [calculatedPizzaPrice, selectedBordaId, selectedAdicionaisCobertura, selectedBebidas, getBordaById, isGrande, bordas]);

  const pizzaConfigurationFeedback = useMemo(() => {
    const portionsArray = Object.entries(flavorPortions).filter(([, count]) => count > 0);
    if (portionsArray.length === 0) return "Selecione os sabores.";
    if (portionsArray.length === 1) {
      const [saborId, count] = portionsArray[0];
      const sabor = getSaborById(saborId);
      if (sabor) {
        if (count === 1) return `Pizza: Metade ${sabor.nome}`;
        if (count === 2) return `Pizza: Inteira de ${sabor.nome}`;
      }
    }
    if (portionsArray.length === 2) {
      const sabor1 = getSaborById(portionsArray[0][0]);
      const sabor2 = getSaborById(portionsArray[1][0]);
      if (sabor1 && sabor2 && portionsArray[0][1] === 1 && portionsArray[1][1] === 1) {
        return `Pizza: Metade ${sabor1.nome}, Metade ${sabor2.nome}`;
      }
    }
    if (totalPortionsSelected < 2) return "Complete a seleção (2 porções).";
    return "Configuração inválida.";
  }, [flavorPortions, getSaborById, totalPortionsSelected]);

  const handleAdicionalCoberturaChange = (adicional: AdicionalPizza, checked: boolean) => {
    setSelectedAdicionaisCobertura(prev => checked ? [...prev, { ...adicional, quantidade: 1 }] : prev.filter(item => item.id !== adicional.id));
  };
  const handleAdicionalCoberturaQuantityChange = (adicionalId: string, change: number) => {
    setSelectedAdicionaisCobertura(prev => prev.map(item => item.id === adicionalId ? { ...item, quantidade: Math.max(0, Math.min(5, item.quantidade + change)) } : item).filter(item => item.quantidade > 0));
  };
  const handleBebidaChange = (bebidaProduto: ProdutoAdmin, checked: boolean) => {
    setSelectedBebidas(prev => checked ? [...prev, { id: bebidaProduto.id, nome: bebidaProduto.nome, preco: bebidaProduto.preco_base || 0, quantidade: 1 }] : prev.filter(item => item.id !== bebidaProduto.id));
  };
  const handleBebidaQuantityChange = (bebidaId: string, change: number) => {
    setSelectedBebidas(prev => prev.map(item => item.id === bebidaId ? { ...item, quantidade: Math.max(1, Math.min(5, item.quantidade + change)) } : item));
  };

  const handleAddToCart = () => {
    if (!isShopOpen) {
        toast({ title: "Loja Fechada", description: shopStatusMessage, variant: "destructive" });
        onOpenChange(false); return;
    }
    if (totalPortionsSelected !== 2) {
      toast({ title: "Seleção Incompleta", description: "Selecione exatamente 2 porções de sabores.", variant: "destructive" }); return;
    }
    let sabor1FinalId: string | undefined, sabor2FinalId: string | undefined;
    const selectedPortionsArray = Object.entries(flavorPortions).filter(([, count]) => count > 0);
    if (selectedPortionsArray.length === 1 && selectedPortionsArray[0][1] === 2) {
      sabor1FinalId = sabor2FinalId = selectedPortionsArray[0][0];
    } else if (selectedPortionsArray.length === 2 && selectedPortionsArray[0][1] === 1 && selectedPortionsArray[1][1] === 1) {
      sabor1FinalId = selectedPortionsArray[0][0]; sabor2FinalId = selectedPortionsArray[1][0];
    } else {
      toast({ title: "Erro na Seleção", description: "Configuração de sabores inválida.", variant: "destructive" }); return;
    }
    addToCart(produto, 1, selectedAdicionaisCobertura, sabor1FinalId, sabor2FinalId, selectedBordaId, undefined, observacoesItem.trim() || undefined);
    toast({ title: "Pizza Adicionada!", description: `${produto.nome} com suas escolhas foi adicionada.`, });
    selectedBebidas.forEach(bebida => {
      const bebidaProdutoOriginal = produtos.find(p => p.id === bebida.id);
      if (bebidaProdutoOriginal) {
        addToCart(bebidaProdutoOriginal, bebida.quantidade);
        toast({ title: "Bebida Adicionada!", description: `${bebida.quantidade}x ${bebida.nome} adicionada(s).`, });
      }
    });
    onOpenChange(false);
  };

  useEffect(() => {
    if (!isOpen) {
        setFlavorPortions({}); setSelectedBordaId(defaultBordaId); setSelectedAdicionaisCobertura([]);
        setSelectedBebidas([]); setObservacoesItem(''); setHasScrolledAfterSabores(false);
    } else { setSelectedBordaId(defaultBordaId); }
  }, [isOpen, defaultBordaId]);

  useEffect(() => {
    if (totalPortionsSelected === 2 && !hasScrolledAfterSabores && isOpen) {
      let scrolled = false;
      if (bordaSectionRef.current) { bordaSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); scrolled = true; }
      else if (bebidasDisponiveis.length > 0 && bebidasSectionRef.current) { bebidasSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); scrolled = true; }
      else if (ingredientesAdicionaisDisponiveis.length > 0 && adicionaisSectionRef.current) { adicionaisSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); scrolled = true; }
      else if (observacoesSectionRef.current) { observacoesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); scrolled = true; }
      if (scrolled) setHasScrolledAfterSabores(true);
    }
    if (totalPortionsSelected < 2 && hasScrolledAfterSabores) setHasScrolledAfterSabores(false);
  }, [totalPortionsSelected, hasScrolledAfterSabores, isOpen, bebidasDisponiveis.length, ingredientesAdicionaisDisponiveis.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center"><Pizza className="mr-3 h-7 w-7 text-primary" />Montar {produto.nome}</DialogTitle>
          <DialogDescription>Selecione 2 porções (mesmo sabor ou meio a meio).</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-3">
          <div className="space-y-6 py-4">
            <div className="space-y-3"><Label className="text-base font-semibold">Escolha os Sabores ({totalPortionsSelected}/2)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {saboresDisponiveis.map(sabor => {
                  const currentPortionCount = flavorPortions[sabor.id] || 0;
                  const saborPrice = isGrande ? sabor.preco_grande : sabor.preco_pequena;
                  return (
                    <Card key={sabor.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow"><p className="font-medium text-sm">{sabor.nome}</p><p className="text-xs text-muted-foreground">Inteira: R$ {saborPrice.toFixed(2).replace('.',',')}</p></div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => handlePortionChange(sabor.id, -1)} disabled={currentPortionCount === 0} aria-label={`Diminuir ${sabor.nome}`}><Minus className="h-4 w-4" /></Button>
                            <span className="w-6 text-center text-sm font-medium">{currentPortionCount}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => handlePortionChange(sabor.id, 1)} disabled={currentPortionCount === 2 || totalPortionsSelected >= 2} aria-label={`Aumentar ${sabor.nome}`}><Plus className="h-4 w-4" /></Button>
                          </div></div></CardContent></Card>);})}</div>
              {totalPortionsSelected !== 2 && (<p className="text-xs text-destructive pt-1">Selecione 2 porções.</p>)}
              <div className="mt-3 p-3 bg-muted/50 rounded-md text-center"><p className="text-sm font-medium">{pizzaConfigurationFeedback}</p></div></div>
            {bordasDisponiveis.length > 0 && (
                <div ref={bordaSectionRef} className="space-y-3 pt-4 border-t"><Label className="text-base font-semibold">Borda Recheada</Label>
                <RadioGroup value={selectedBordaId} onValueChange={setSelectedBordaId} className="space-y-2">
                    {bordasDisponiveis.map(borda => {
                      // Borda has preco_pequena and preco_grande directly
                      const precoBordaAdicional = isGrande ? (borda.preco_grande ?? 0) : (borda.preco_pequena ?? 0);
                      return (
                        <div key={borda.id} className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-muted/30 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                            <RadioGroupItem value={borda.id} id={`borda-${borda.id}`} />
                            <Label htmlFor={`borda-${borda.id}`} className="text-sm font-medium flex-grow cursor-pointer">
                            {borda.nome}
                            {precoBordaAdicional > 0 ? (<span className="text-xs text-muted-foreground ml-1">(+R$ {precoBordaAdicional.toFixed(2).replace('.',',')})</span>) : ''}
                            </Label></div>);})}
                </RadioGroup></div>)}
            {bebidasDisponiveis.length > 0 && (
              <div ref={bebidasSectionRef} className="space-y-3 pt-4 border-t"><Label className="text-base font-semibold flex items-center"><GlassWater className="mr-2 h-5 w-5 text-primary" />Bebidas (Opcional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                  {bebidasDisponiveis.map(bebidaProduto => {
                    const isSelected = selectedBebidas.some(sb => sb.id === bebidaProduto.id);
                    const currentBebidaSelection = selectedBebidas.find(sb => sb.id === bebidaProduto.id);
                    return (
                      <div key={bebidaProduto.id} className="p-3 border rounded-md bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <Label htmlFor={`bebida-${bebidaProduto.id}`} className="flex items-center text-sm font-medium"><Checkbox id={`bebida-${bebidaProduto.id}`} checked={isSelected} onCheckedChange={(checked) => handleBebidaChange(bebidaProduto, !!checked)} className="mr-2"/>{bebidaProduto.nome}</Label>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">+R$ {(bebidaProduto.preco_base ?? 0).toFixed(2).replace('.', ',')}</span></div>
                        {isSelected && (<div className="flex items-center justify-end gap-1.5 mt-1.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleBebidaQuantityChange(bebidaProduto.id, -1)} disabled={(currentBebidaSelection?.quantidade ?? 0) <= 1}><MinusCircle className="h-4 w-4" /></Button>
                            <Input type="number" className="h-7 w-10 text-center text-sm p-0" value={currentBebidaSelection?.quantidade ?? 0} readOnly/>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleBebidaQuantityChange(bebidaProduto.id, 1)} disabled={(currentBebidaSelection?.quantidade ?? 0) >= 5}><PlusCircle className="h-4 w-4" /></Button></div>)}</div>);})}</div></div>)}
           {ingredientesAdicionaisDisponiveis.length > 0 && (
            <div ref={adicionaisSectionRef} className="space-y-3 pt-4 border-t"><Label className="text-base font-semibold">Adicionais (Opcional)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                {ingredientesAdicionaisDisponiveis.map(adicional => {
                  const isSelected = selectedAdicionaisCobertura.some(sa => sa.id === adicional.id);
                  const currentAdicional = selectedAdicionaisCobertura.find(sa => sa.id === adicional.id);
                  return (
                    <div key={adicional.id} className="p-3 border rounded-md bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                           <Label htmlFor={`adicional-${adicional.id}`} className="flex items-center text-sm font-medium"><Checkbox id={`adicional-${adicional.id}`} checked={isSelected} onCheckedChange={(checked) => handleAdicionalCoberturaChange(adicional, !!checked)} className="mr-2"/>{adicional.nome}</Label>
                           <span className="text-xs text-muted-foreground whitespace-nowrap">+R$ {adicional.preco.toFixed(2).replace('.', ',')}</span></div>
                      {isSelected && (<div className="flex items-center justify-end gap-1.5 mt-1.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAdicionalCoberturaQuantityChange(adicional.id, -1)} disabled={(currentAdicional?.quantidade ?? 0) <= 0}><MinusCircle className="h-4 w-4" /></Button>
                          <Input type="number" className="h-7 w-10 text-center text-sm p-0" value={currentAdicional?.quantidade ?? 0} readOnly/>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAdicionalCoberturaQuantityChange(adicional.id, 1)} disabled={(currentAdicional?.quantidade ?? 0) >= 5}><PlusCircle className="h-4 w-4" /></Button></div>)}</div>);})}</div></div>)}
            <div ref={observacoesSectionRef} className="space-y-3 pt-4 border-t"><Label htmlFor="observacoesPizza" className="text-base font-semibold flex items-center"><MessageSquareText className="mr-2 h-5 w-5 text-primary" />Comentário?</Label>
              <Textarea id="observacoesPizza" placeholder="Ex: Sem cebola, bem assada..." value={observacoesItem} onChange={(e) => setObservacoesItem(e.target.value)} className="min-h-[60px]"/></div></div></ScrollArea>
        <Separator className="my-2"/>
        <DialogFooter className="sm:justify-between items-center pt-2 mt-0">
          <div className="text-xl font-bold text-primary">Total: R$ {calculatedTotalPrice.toFixed(2).replace('.',',')}</div>
          <div className="flex gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="button" onClick={handleAddToCart} disabled={totalPortionsSelected !== 2 || !isShopOpen} className="bg-accent hover:bg-accent/90 text-accent-foreground">Adicionar</Button></div></DialogFooter></DialogContent></Dialog>
  );
}

