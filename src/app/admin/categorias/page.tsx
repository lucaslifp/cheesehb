
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown, Search, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/types/supabase'; // Using Supabase generated types
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// Directly use the Supabase generated type for a row in the 'categorias' table
type CategoriaRow = Database["public"]["Tables"]["categorias"]["Row"];

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [currentCategoria, setCurrentCategoria] = useState<Partial<CategoriaRow> | null>(null);
  const [nomeCategoriaForm, setNomeCategoriaForm] = useState('');
  const [ordemCategoriaForm, setOrdemCategoriaForm] = useState<number>(0);
  const [mostrarNosFiltrosForm, setMostrarNosFiltrosForm] = useState<boolean>(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaRow | null>(null);

  const fetchCategorias = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/categorias');
      if (!response.ok) {
        let errorDetail = 'Falha ao buscar categorias.';
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            errorDetail = errorData.error;
          } else {
            errorDetail = `Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
        } catch (parseError) {
          errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
        }
        throw new Error(errorDetail);
      }
      const data: CategoriaRow[] = await response.json();
      const mappedData = data.map(cat => ({
        ...cat,
        mostrar_nos_filtros_homepage: cat.mostrar_nos_filtros_homepage ?? true, 
      }));
      setCategorias(mappedData.sort((a, b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity)));
    } catch (error: any) {
      console.error("Erro ao carregar categorias:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível carregar as categorias.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleOpenAddDialog = () => {
    setCurrentCategoria(null);
    setNomeCategoriaForm('');
    const maxOrder = categorias.reduce((max, cat) => Math.max(max, cat.ordem ?? 0), 0);
    setOrdemCategoriaForm(categorias.length > 0 ? maxOrder + 10 : 100);
    setMostrarNosFiltrosForm(true);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (categoria: CategoriaRow) => {
    setCurrentCategoria(categoria);
    setNomeCategoriaForm(categoria.nome);
    setOrdemCategoriaForm(categoria.ordem ?? 0);
    setMostrarNosFiltrosForm(categoria.mostrar_nos_filtros_homepage ?? true);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nomeCategoriaForm.trim()) {
      toast({ title: "Erro", description: "O nome da categoria não pode ser vazio.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const categoriaData = {
      nome: nomeCategoriaForm,
      ordem: ordemCategoriaForm,
      mostrar_nos_filtros_homepage: mostrarNosFiltrosForm,
    };

    try {
      let response;
      if (currentCategoria && currentCategoria.id) { 
        response = await fetch(`/api/admin/categorias/${currentCategoria.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoriaData),
        });
      } else { 
        response = await fetch('/api/admin/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoriaData),
        });
      }

      if (!response.ok) {
        let errorDetail = `Falha ao ${currentCategoria?.id ? 'atualizar' : 'adicionar'} categoria.`;
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            errorDetail = errorData.error;
          } else {
            errorDetail = `Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
        } catch (parseError) {
          errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
        }
        throw new Error(errorDetail);
      }
      
      await fetchCategorias(); 

      toast({ title: `Categoria ${currentCategoria?.id ? 'Atualizada' : 'Adicionada'}!`, description: `A categoria "${nomeCategoriaForm}" foi salva com sucesso.` });
      setIsFormDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (categoria: CategoriaRow) => {
    setCategoriaToDelete(categoria);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoriaToDelete) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/categorias/${categoriaToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao excluir categoria.';
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            errorDetail = errorData.error;
          } else {
            errorDetail = `Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
        } catch (parseError) {
          errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
        }
        throw new Error(errorDetail);
      }
      
      await fetchCategorias(); 

      toast({ title: "Categoria Excluída!", description: `A categoria "${categoriaToDelete.nome}" foi excluída.` });
    } catch (error: any) {
      toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setCategoriaToDelete(null);
    }
  };

  const moveCategoria = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = categorias.findIndex(cat => cat.id === id);
    if (currentIndex === -1) return;

    const newCategorias = [...categorias];
    const itemToMove = newCategorias[currentIndex];
    let itemToSwapWith: CategoriaRow | undefined;

    if (direction === 'up' && currentIndex > 0) {
      itemToSwapWith = newCategorias[currentIndex - 1];
    } else if (direction === 'down' && currentIndex < newCategorias.length - 1) {
      itemToSwapWith = newCategorias[currentIndex + 1];
    }

    if (itemToMove && itemToSwapWith) {
      const tempOrder = itemToMove.ordem;
      itemToMove.ordem = itemToSwapWith.ordem;
      itemToSwapWith.ordem = tempOrder;

      setIsSubmitting(true);
      try {
        await Promise.all([
          fetch(`/api/admin/categorias/${itemToMove.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordem: itemToMove.ordem }),
          }),
          fetch(`/api/admin/categorias/${itemToSwapWith.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordem: itemToSwapWith.ordem }),
          })
        ]);
        setCategorias(newCategorias.sort((a, b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity)));
        toast({ title: "Ordem alterada!", description: `A ordem de "${itemToMove.nome}" foi ajustada.`});
      } catch (error) {
        console.error("Erro ao reordenar:", error);
        toast({ title: "Erro", description: "Falha ao salvar a nova ordem.", variant: "destructive" });
        await fetchCategorias(); 
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const filteredCategorias = useMemo(() => {
    return categorias
      .filter(categoria => categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity));
  }, [categorias, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Gerenciar Categorias</h1>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias de Produtos</CardTitle>
          <CardDescription>
            Organize seus produtos em categorias. Você pode adicionar, editar, remover, reordenar e definir se uma categoria aparece nos filtros da homepage.
          </CardDescription>
          <div className="mt-4 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria por nome..."
              className="pl-8 w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Carregando categorias...</p>
            </div>
          ) : filteredCategorias.length > 0 ? (
            <ScrollArea className="h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center w-[100px]">Ordem</TableHead>
                    <TableHead className="text-center w-[180px]">Visível na Homepage</TableHead>
                    <TableHead className="text-right w-[250px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategorias.map((categoria, index) => (
                    <TableRow key={categoria.id}>
                      <TableCell className="font-medium">{categoria.nome}</TableCell>
                      <TableCell className="text-center">{categoria.ordem ?? '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={categoria.mostrar_nos_filtros_homepage ? 'default' : 'outline'} className="cursor-default">
                          {categoria.mostrar_nos_filtros_homepage ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                          {categoria.mostrar_nos_filtros_homepage ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => moveCategoria(categoria.id, 'up')} disabled={index === 0 || isSubmitting} title="Mover para Cima">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => moveCategoria(categoria.id, 'down')} disabled={index === filteredCategorias.length - 1 || isSubmitting} title="Mover para Baixo">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(categoria)} disabled={isSubmitting} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleOpenDeleteDialog(categoria)} disabled={isSubmitting} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? `Nenhuma categoria encontrada com o termo "${searchTerm}".` : "Nenhuma categoria cadastrada."}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 border-t pt-6">
           <Link href="/admin">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentCategoria?.id ? 'Editar' : 'Adicionar'} Categoria</DialogTitle>
            <DialogDescription>
              {currentCategoria?.id ? 'Altere os dados da categoria abaixo.' : 'Preencha os dados para a nova categoria.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">Nome</Label>
                <Input id="nome" value={nomeCategoriaForm} onChange={(e) => setNomeCategoriaForm(e.target.value)} className="col-span-3" placeholder="Nome da categoria" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ordem" className="text-right">Ordem</Label>
                <Input id="ordem" type="number" value={ordemCategoriaForm} onChange={(e) => setOrdemCategoriaForm(Number(e.target.value))} className="col-span-3" placeholder="Ex: 10" />
              </div>
              <div className="flex items-center space-x-2 col-span-4 pl-4 pt-2">
                 <Switch
                    id="mostrarNosFiltrosHomepage"
                    checked={mostrarNosFiltrosForm}
                    onCheckedChange={setMostrarNosFiltrosForm}
                  />
                <Label htmlFor="mostrarNosFiltrosHomepage" className="text-sm">Mostrar nos filtros da homepage</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoriaToDelete?.nome}"?
              Esta ação não poderá ser desfeita. Se houver produtos associados a esta categoria, pode ocorrer um erro ou eles ficarão sem categoria (dependendo da configuração do banco).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoriaToDelete(null)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
