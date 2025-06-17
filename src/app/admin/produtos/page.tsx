
"use client";

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Search, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import type { ProdutoAdmin } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [filtroCardapio, setFiltroCardapio] = useState<'todos' | 'sim' | 'nao'>('todos');
  const [filtroAdicional, setFiltroAdicional] = useState<'todos' | 'sim' | 'nao'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<ProdutoAdmin | null>(null);

  const fetchProdutos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/produtos?personalizable=false');
      if (!response.ok) {
        let errorDetail = 'Falha ao buscar produtos.';
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson && errorJson.error) errorDetail = errorJson.error;
        } catch (e) { /* use raw errorText */ }
        throw new Error(errorDetail);
      }
      const data: ProdutoAdmin[] = await response.json();
      setProdutos(data.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro ao carregar produtos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProdutos(); }, []);

  const handleOpenDeleteDialog = (produto: ProdutoAdmin) => {
    setProdutoToDelete(produto);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!produtoToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/produtos/${produtoToDelete.id}`, { method: 'DELETE' });
       if (!response.ok) {
        let errorDetail = 'Falha ao excluir produto.';
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson && errorJson.error) errorDetail = errorJson.error;
        } catch (e) { /* use raw errorText */ }
        throw new Error(errorDetail);
      }
      await fetchProdutos();
      toast({ title: 'Produto excluído', description: `"${produtoToDelete.nome}" foi removido.` });
    } catch (e: any) {
      toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setProdutoToDelete(null);
    }
  };

  const categoriasUnicas = useMemo(() => {
    const nomesUnicos = Array.from(new Set(produtos.map(p => p.nome_categoria).filter(Boolean)));
    return nomesUnicos.sort((a,b) => (a as string).localeCompare(b as string));
  }, [produtos]);

  const filteredProdutos = useMemo(() => {
    return produtos.filter((produto) => {
      const matchNome = produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filtroStatus === 'todos' || (filtroStatus === 'ativo' && produto.ativo) || (filtroStatus === 'inativo' && !produto.ativo);
      const matchCardapio = filtroCardapio === 'todos' || (filtroCardapio === 'sim' && produto.mostrar_no_cardapio) || (filtroCardapio === 'nao' && !produto.mostrar_no_cardapio);
      const matchAdicional = filtroAdicional === 'todos' || (filtroAdicional === 'sim' && produto.usar_como_adicional) || (filtroAdicional === 'nao' && !produto.usar_como_adicional);
      const matchCategoria = filtroCategoria === 'todos' || produto.nome_categoria === filtroCategoria;
      return matchNome && matchStatus && matchCardapio && matchAdicional && matchCategoria;
    });
  }, [produtos, searchTerm, filtroStatus, filtroCardapio, filtroAdicional, filtroCategoria]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Gerenciar Produtos (Geral)</h1>
        <Link href="/admin/produtos/novo">
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem de Produtos Gerais</CardTitle>
          <CardDescription>Visualize, edite ou adicione novos produtos (bebidas, hambúrgueres, etc.).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Carregando produtos...</span>
            </div>
          ) : (
            <ScrollArea className="h-[65vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Imagem</TableHead>
                    <TableHead className="min-w-[200px]">
                        <div className="flex flex-col gap-1">
                            Nome
                            <Input
                                placeholder="Buscar nome..."
                                className="h-7 text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Preço</TableHead>
                    <TableHead className="w-[120px]">
                        <div className="flex flex-col gap-1">
                            Status
                            <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as any)}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                        <div className="flex flex-col gap-1">
                            Cardápio
                            <Select value={filtroCardapio} onValueChange={(value) => setFiltroCardapio(value as any)}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="sim">Sim</SelectItem>
                                <SelectItem value="nao">Não</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                        <div className="flex flex-col gap-1">
                            Adicional
                             <Select value={filtroAdicional} onValueChange={(value) => setFiltroAdicional(value as any)}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="sim">Sim</SelectItem>
                                <SelectItem value="nao">Não</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                        <div className="flex flex-col gap-1">
                            Categoria
                            <Select value={filtroCategoria} onValueChange={(value) => setFiltroCategoria(value as any)}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                <SelectItem value="todos">Todas</SelectItem>
                                {categoriasUnicas.map((c) => (
                                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProdutos.map(produto => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <img
                          src={produto.imagem_url || 'https://placehold.co/50x50.png'}
                          alt={produto.nome}
                          width={50}
                          height={50}
                          className="rounded aspect-square object-cover"
                          data-ai-hint={produto.image_hint || "product image"}
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/50x50.png?text=Erro'; }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>R$ {produto.preco_base.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={produto.ativo ? 'default' : 'outline'} className="cursor-default">
                          {produto.ativo ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-center">
                        <Badge variant={produto.mostrar_no_cardapio ? 'default' : 'outline'} className="cursor-default">
                          {produto.mostrar_no_cardapio ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                           {produto.mostrar_no_cardapio ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={produto.usar_como_adicional ? 'default' : 'outline'} className="cursor-default">
                           {produto.usar_como_adicional ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                      <TableCell>{produto.nome_categoria || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-right space-x-0.5">
                        <Link href={`/admin/produtos/${produto.id}/editar`}>
                          <Button variant="ghost" size="icon" title="Editar Produto" disabled={isSubmitting}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(produto)} title="Excluir Produto" className="text-destructive hover:text-destructive/80" disabled={isSubmitting}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="mt-6 border-t pt-6">
          <Link href="/admin">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard</Button>
          </Link>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{produtoToDelete?.nome}"?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProdutoToDelete(null)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
