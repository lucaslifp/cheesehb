
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ArrowLeft, Pizza, Edit, Trash2, Search, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { Database } from '@/types/supabase'; // Using Supabase generated types
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

// Directly use the Supabase generated type for a row in the 'sabores_pizza' table
type SaborPizzaRow = Database["public"]["Tables"]["sabores_pizza"]["Row"];

export default function AdminSaboresPizzaPage() {
  const [sabores, setSabores] = useState<SaborPizzaRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [saborToDelete, setSaborToDelete] = useState<SaborPizzaRow | null>(null);

  const fetchSabores = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/sabores-pizza');
      if (!response.ok) {
        let errorDetail = 'Falha ao buscar sabores de pizza.';
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
      const data: SaborPizzaRow[] = await response.json();
      setSabores(data.map(s => ({...s, ativo: s.ativo === null ? true : s.ativo})).sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error: any) {
      console.error("Erro ao carregar sabores:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível carregar os sabores.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSabores();
  }, []);

  const handleOpenDeleteDialog = (sabor: SaborPizzaRow) => {
    setSaborToDelete(sabor);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saborToDelete) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/sabores-pizza/${saborToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao excluir o sabor.';
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
      
      await fetchSabores(); 
      toast({ title: "Sabor Excluído!", description: `O sabor "${saborToDelete.nome}" foi excluído.` });
    } catch (error: any) {
      toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setSaborToDelete(null);
    }
  };

  const filteredSabores = useMemo(() => {
    return sabores.filter(sabor =>
      sabor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sabor.categoria_sabor.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sabores, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Gerenciar Sabores de Pizza</h1>
        <Link href="/admin/sabores-pizza/novo" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Sabor
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sabores de Pizza Cadastrados</CardTitle>
          <CardDescription>
            Visualize, adicione, edite ou remova os sabores de pizza disponíveis na sua loja.
            Os preços são definidos para os tamanhos Grande (G) e Pequena (P).
          </CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria (Salgada/Doce)..."
              className="pl-8 w-full md:w-2/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Carregando sabores...</p>
            </div>
          ) : filteredSabores.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Sabor</TableHead>
                    <TableHead className="text-center">Preço (P)</TableHead>
                    <TableHead className="text-center">Preço (G)</TableHead>
                    <TableHead className="text-center">Categoria</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSabores.map((sabor) => (
                    <TableRow key={sabor.id}>
                      <TableCell className="font-medium">{sabor.nome}</TableCell>
                      <TableCell className="text-center">R$ {sabor.preco_pequena.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="text-center">R$ {sabor.preco_grande.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={sabor.categoria_sabor === 'Salgada' ? 'default' : 'secondary'}>
                            {sabor.categoria_sabor}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={sabor.ativo ? 'default' : 'outline'} className="cursor-default">
                            {sabor.ativo ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                            {sabor.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/admin/sabores-pizza/${sabor.id}/editar`}>
                          <Button variant="ghost" size="icon" title="Editar Sabor" disabled={isSubmitting}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleOpenDeleteDialog(sabor)} title="Excluir Sabor" disabled={isSubmitting}>
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
              {searchTerm ? `Nenhum sabor encontrado com o termo "${searchTerm}".` : "Nenhum sabor de pizza cadastrado."}
            </p>
          )}
        </CardContent>
         <CardFooter className="mt-6 border-t pt-6 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4">
                <Link href="/admin/pizzas">
                    <Button variant="outline">
                        <Pizza className="mr-2 h-4 w-4" /> Voltar para Pizza Meio a Meio
                    </Button>
                </Link>
                <Link href="/admin">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
                    </Button>
                </Link>
            </div>
          </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o sabor "{saborToDelete?.nome}"?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaborToDelete(null)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
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
