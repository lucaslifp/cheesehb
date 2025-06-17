
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { supabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UploadCloud, Loader2 } from "lucide-react";
import Link from "next/link";
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '@/types/supabase'; 
import type { CategoriaAdmin, GrupoOpcional as GrupoOpcionalType } from '@/types';
import type { ProdutoCreate, ProdutoUpdate } from '@/schemas';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProdutoFromDB = Database["public"]["Tables"]["produtos"]["Row"];
export type ProdutoDataToSubmit = Omit<ProdutoCreate, 'id' | 'created_at' | 'updated_at'> | Omit<ProdutoUpdate, 'id' | 'created_at' | 'updated_at'>;

interface ProdutoFormProps {
  onSubmit: (data: ProdutoDataToSubmit) => Promise<void>;
  initialData?: Partial<ProdutoFromDB>;
  isEditMode?: boolean;
  isLoading?: boolean;
  initialProductType: 'produto_geral' | 'pizza_personalizavel';
}

export function ProdutoForm({
  onSubmit,
  initialData,
  isEditMode = false,
  isLoading = false,
  initialProductType,
}: ProdutoFormProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoBaseString, setPrecoBaseString] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [tamanhoPizzaForm, setTamanhoPizzaForm] = useState<'pequena' | 'grande' | ''>('');

  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(true);
  const [mostrarNoCardapio, setMostrarNoCardapio] = useState(true);
  const [usarComoAdicional, setUsarComoAdicional] = useState(false);
  
  const [gruposOpcionais, setGruposOpcionais] = useState<GrupoOpcionalType[]>([]);
  const [selectedGruposOpcionaisIds, setSelectedGruposOpcionaisIds] = useState<string[]>([]);
  
  const mapDbTamanhoToForm = (dbSizes: string[] | null | undefined): 'pequena' | 'grande' | '' => {
    if (dbSizes && dbSizes.length > 0) {
        if (dbSizes.includes('grande')) return 'grande';
        if (dbSizes.includes('pequena')) return 'pequena';
    }
    return '';
  };

  const mapFormTamanhoToDb = (formTamanho: 'pequena' | 'grande' | ''): string[] | null => {
    if (formTamanho) return [formTamanho];
    return null;
  };

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome || '');
      setDescricao(initialData.descricao || '');
      setPrecoBaseString(initialData.preco_base !== undefined && initialData.preco_base !== null ? Number(initialData.preco_base).toFixed(2).replace('.', ',') : '');
      setImagemUrl(initialData.imagem_url || null);
      setImagemPreview(initialData.imagem_url || null);
      setSelectedCategoriaId(initialData.categoria_id || null);
      setAtivo(initialData.ativo === null ? true : initialData.ativo);
      setMostrarNoCardapio(initialData.mostrar_no_cardapio === null ? true : initialData.mostrar_no_cardapio);
      setUsarComoAdicional(initialData.usar_como_adicional || false);
      setSelectedGruposOpcionaisIds(initialData.grupos_opcionais_ids || []);

      if (initialProductType === 'pizza_personalizavel' || initialData.is_personalizable_pizza) {
        setTamanhoPizzaForm(mapDbTamanhoToForm(initialData.available_sizes));
      }
    } else {
      setNome(''); setDescricao(''); setPrecoBaseString(''); setImagemUrl(null);
      setImagemPreview(null); setSelectedCategoriaId(null); setAtivo(true);
      setMostrarNoCardapio(true); setUsarComoAdicional(false);
      setSelectedGruposOpcionaisIds([]);
      setTamanhoPizzaForm('');
    }
  }, [initialData, initialProductType]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('/api/admin/categorias');
        if (response.ok) {
          const data: CategoriaAdmin[] = await response.json();
          setCategorias(data.sort((a,b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity) || a.nome.localeCompare(b.nome)));
        } else {
          toast({ title: "Erro", description: "Falha ao carregar categorias.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Erro de Rede", description: "Não foi possível buscar categorias.", variant: "destructive" });
      }
    };
    fetchCategorias();
    
    const fetchGruposOpcionais = async () => {
      try {
        const response = await fetch('/api/admin/grupos-opcionais');
        if (response.ok) {
          const data: GrupoOpcionalType[] = await response.json();
          setGruposOpcionais(data.sort((a,b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity) || a.nome.localeCompare(b.nome)));
        } else {
          toast({ title: "Erro", description: "Falha ao carregar grupos opcionais.", variant: "destructive" });
        }
      } catch (error) {
          toast({ title: "Erro de Rede", description: "Não foi possível buscar grupos opcionais.", variant: "destructive" });
      }
    };

    if (initialProductType === 'produto_geral' || (isEditMode && initialData && !initialData.is_personalizable_pizza)) {
        fetchGruposOpcionais();
    }
  }, [initialProductType, isEditMode, initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setImagemFile(file);
    setImagemPreview(URL.createObjectURL(file));
    setImagemUrl(null);
    toast({ title: "Prévia da Imagem Carregada", description: "A imagem será enviada ao salvar o produto." });
    setIsUploading(false);
  };

  const internalHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImagemUrl = imagemUrl; 

    if (imagemFile) { 
      setIsUploading(true);
      const uniqueFileName = `${uuidv4()}-${imagemFile.name}`;
      const filePath = `produtos/${uniqueFileName}`;
      try {
        const { data: uploadData, error: uploadError } = await supabaseBrowserClient.storage
          .from('public-assets')
          .upload(filePath, imagemFile, { cacheControl: '3600', upsert: isEditMode });
        if (uploadError) throw uploadError;
        finalImagemUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${filePath}`;
      } catch (error: any) {
        setIsUploading(false);
        toast({ title: "Erro no Upload da Imagem", description: error.message, variant: "destructive" });
        return;
      }
      setIsUploading(false);
    }

    let precoBaseNumber: number | undefined = undefined;
    if (initialProductType === 'produto_geral' || (isEditMode && initialData && !initialData.is_personalizable_pizza)) {
        const rawPreco = precoBaseString.replace(/[^\d,]/g, '').replace(',', '.');
        const parsedFloat = parseFloat(rawPreco);
        if (!isNaN(parsedFloat) && parsedFloat >= 0) {
            precoBaseNumber = parsedFloat;
        } else {
          precoBaseNumber = undefined;
        }
    }

    const dataToSubmit: ProdutoDataToSubmit = {
      nome,
      descricao: descricao || null,
      imagem_url: finalImagemUrl || null,
      image_hint: initialData?.image_hint || null,
      preco_base: precoBaseNumber,
      preco_promocional: initialData?.preco_promocional, 
      is_personalizable_pizza: initialProductType === 'pizza_personalizavel',
      available_sizes: (initialProductType === 'pizza_personalizavel' && tamanhoPizzaForm) ? mapFormTamanhoToDb(tamanhoPizzaForm) : null,
      tipo_pizza: initialProductType === 'pizza_personalizavel' 
                    ? (isEditMode && initialData?.tipo_pizza ? initialData.tipo_pizza : "salgada") 
                    : null,
      categoria_id: initialProductType === 'produto_geral' ? (selectedCategoriaId || null) : null,
      ativo: ativo,
      mostrar_no_cardapio: mostrarNoCardapio,
      usar_como_adicional: initialProductType === 'produto_geral' ? usarComoAdicional : false,
      onde_aparece_como_adicional: initialProductType === 'produto_geral' && usarComoAdicional ? initialData?.onde_aparece_como_adicional : null, 
      grupos_opcionais_ids: (initialProductType === 'produto_geral' && selectedGruposOpcionaisIds.length > 0) ? selectedGruposOpcionaisIds : null,
    };
    
    if (isEditMode && initialData?.id) {
        (dataToSubmit as ProdutoUpdate).id = initialData.id;
    }

    await onSubmit(dataToSubmit);
  };

  const handlePrecoStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.trim() === "" || val.trim().toLowerCase() === "r$") {
      setPrecoBaseString("");
      return;
    }
    const digits = val.replace(/\D/g, "");
    if (digits === "") {
      setPrecoBaseString("");
      return;
    }
    const numberValue = parseInt(digits, 10) / 100;
    setPrecoBaseString(numberValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
  };
  
  const handleGrupoOpcionalToggle = (grupoId: string) => {
    setSelectedGruposOpcionaisIds(prev =>
      prev.includes(grupoId) ? prev.filter(id => id !== grupoId) : [...prev, grupoId]
    );
  };

  return (
    <form onSubmit={internalHandleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {isEditMode ? 'Editar ' : 'Adicionar Novo '}
            {initialProductType === 'pizza_personalizavel' ? 'Pizza Meio a Meio' : 'Produto Geral'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto/Pizza</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={isLoading || isUploading}/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea id="descricao" value={descricao || ''} onChange={(e) => setDescricao(e.target.value)} disabled={isLoading || isUploading}/>
          </div>

          {initialProductType === 'produto_geral' && (
            <div className="space-y-2">
              <Label htmlFor="preco_base">Preço do Produto (R$)</Label>
              <Input
                id="preco_base"
                value={precoBaseString}
                onChange={handlePrecoStringChange}
                onBlur={(e) => {
                    if (e.target.value.match(/^\d{1,2}$/)) { 
                        setPrecoBaseString( (parseInt(e.target.value,10)).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) );
                    } else if (precoBaseString && !isNaN(parseFloat(precoBaseString.replace(/\./g, '').replace(',','.')))) { 
                        setPrecoBaseString(parseFloat(precoBaseString.replace(/\./g, '').replace(',','.')).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
                    }
                 }}
                placeholder="0,00"
                disabled={isLoading || isUploading}
              />
            </div>
          )}

           {initialProductType === 'pizza_personalizavel' && (
            <>
              <Separator />
              <p className="text-sm font-medium text-muted-foreground pt-2">Configurações da Pizza Meio a Meio:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tamanhoPizzaForm">Tamanho da Pizza</Label>
                  <Select value={tamanhoPizzaForm} onValueChange={(val) => setTamanhoPizzaForm(val as 'pequena' | 'grande' | '')} disabled={isLoading || isUploading}>
                    <SelectTrigger id="tamanhoPizzaForm"><SelectValue placeholder="Selecione o tamanho" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequena">Pequena</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O preço para Pizzas Meio a Meio é calculado com base nos sabores escolhidos.
              </p>
              <Separator />
            </>
          )}

          {initialProductType === 'produto_geral' && (
                 <div className="space-y-2">
                    <Label htmlFor="categoria_id">Categoria</Label>
                    <Select value={selectedCategoriaId || ""} onValueChange={setSelectedCategoriaId} disabled={isLoading || isUploading || categorias.length === 0}>
                        <SelectTrigger id="categoria_id">
                        <SelectValue placeholder={categorias.length === 0 ? "Nenhuma categoria cadastrada" : "Selecione a categoria"} />
                        </SelectTrigger>
                        <SelectContent>
                        {categorias.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="imagemUpload">Imagem do Produto/Pizza</Label>
            <div className="flex items-center gap-4">
              {imagemPreview && (
                <Image
                  src={imagemPreview}
                  alt="Prévia da Imagem"
                  width={100}
                  height={100}
                  className="rounded-md border object-cover aspect-square"
                  onError={() => { console.warn("Erro ao carregar imagem preview:", imagemPreview); setImagemPreview('https://placehold.co/100x100.png?text=Erro'); }}
                  data-ai-hint={initialProductType === 'pizza_personalizavel' ? "pizza meio a meio" : "product image"}
                />
              )}
              <div className="flex flex-col gap-2 flex-grow">
                <Input
                  id="imagemUpload"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-muted-foreground hover:file:bg-muted/80"
                  disabled={isLoading || isUploading}
                />
              </div>
              {isUploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
          </div>
          <Separator />
             <div className="space-y-4">
                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                    <Label htmlFor="ativoSwitch">Produto Ativo</Label>
                    <p className="text-xs text-muted-foreground">
                        Se ativo, o produto pode ser vendido e aparecerá em listagens (se "Mostrar no Cardápio" também estiver ativo).
                    </p>
                    </div>
                    <Switch id="ativoSwitch" checked={ativo} onCheckedChange={setAtivo} disabled={isLoading || isUploading}/>
                </div>
                 <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                    <Label htmlFor="mostrarCardapioSwitch">Mostrar no Cardápio Principal</Label>
                    <p className="text-xs text-muted-foreground">
                        Se marcado, este produto será visível para os clientes na página inicial/cardápio.
                    </p>
                    </div>
                    <Switch id="mostrarCardapioSwitch" checked={mostrarNoCardapio} onCheckedChange={setMostrarNoCardapio} disabled={isLoading || isUploading}/>
                </div>
                 {initialProductType === 'produto_geral' && (
                    <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                        <Label htmlFor="usarComoAdicionalSwitch">Usar Como Adicional de Outros Produtos</Label>
                        <p className="text-xs text-muted-foreground">
                            Marque se este produto (ex: Bacon Extra, Queijo Extra) pode ser um opcional para outros itens.
                        </p>
                        </div>
                        <Switch id="usarComoAdicionalSwitch" checked={usarComoAdicional} onCheckedChange={setUsarComoAdicional} disabled={isLoading || isUploading}/>
                    </div>
                )}
             </div>
            {initialProductType === 'produto_geral' && gruposOpcionais.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Grupos de Opcionais para este Produto</Label>
                        <p className="text-xs text-muted-foreground">
                            Selecione quais grupos de itens opcionais (ex: "Escolha sua bebida", "Adicionais para Hambúrguer")
                            devem ser apresentados ao cliente quando este produto for selecionado.
                        </p>
                        <ScrollArea className="h-40 rounded-md border p-2">
                            <div className="space-y-2">
                            {gruposOpcionais.map(grupo => (
                                <div key={grupo.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                                <Checkbox
                                    id={`grupo-${grupo.id}`}
                                    checked={selectedGruposOpcionaisIds.includes(grupo.id)}
                                    onCheckedChange={() => handleGrupoOpcionalToggle(grupo.id)}
                                    disabled={isLoading || isUploading}
                                />
                                <Label htmlFor={`grupo-${grupo.id}`} className="text-sm font-normal cursor-pointer">
                                    {grupo.nome} <span className="text-xs text-muted-foreground">({grupo.itens.length} itens)</span>
                                </Label>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
                </>
            )}
        </CardContent>
      </Card>
      <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
        <Link href={initialProductType === 'pizza_personalizavel' ? "/admin/pizzas" : "/admin/produtos"} passHref>
            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isLoading || isUploading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Button>
        </Link>
        <Button type="submit" disabled={isLoading || isUploading} className="w-full sm:w-auto">
            {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Salvando..." : (isEditMode ? "Salvar Alterações" : (initialProductType === 'pizza_personalizavel' ? "Cadastrar Pizza Meio a Meio" : "Cadastrar Produto"))}
        </Button>
      </div>
    </form>
  );
}
