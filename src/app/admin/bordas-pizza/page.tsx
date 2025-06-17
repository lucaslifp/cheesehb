
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ArrowLeft, Pizza, Edit, Trash2, Search, Eye, EyeOff, Loader2, CircleDot } from 'lucide-react';
import type { Borda } from '@/types'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

export default function AdminBordasPizzaPage() {
  const [bordas, setBordas] = useState<Borda[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bordaToDelete, setBordaToDelete] = useState<Borda | null>(null);

  const fetchBordas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bordas-pizza');
      if (!response.ok) {
        let errorDetail = 'Falha ao buscar opções de borda.';
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
      const data: Borda[] = await response.json(); // API now returns Borda[] with direct price fields
      setBordas(data.map(b => ({...b, ativo: b.ativo === null ? true : b.ativo})).sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error: any) {
      console.error("Erro ao carregar bordas:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível carregar as opções de borda.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBordas();
  }, []);

  const handleOpenDeleteDialog = (borda: Borda) => {
    setBordaToDelete(borda);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bordaToDelete) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/bordas-pizza/${bordaToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao excluir a opção de borda.';
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
      
      await fetchBordas(); 
      toast({ title: "Borda Excluída!", description: `A opção de borda "${bordaToDelete.nome}" foi excluída.` });
    } catch (error: any) {
      toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setBordaToDelete(null);
    }
  };

  const filteredBordas = useMemo(() => {
    return bordas.filter(borda =>
      borda.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bordas, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Gerenciar Opções de Borda</h1>
        <Link href="/admin/bordas-pizza/novo" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Borda
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Opções de Borda Cadastradas</CardTitle>
          <CardDescription>
            Visualize, adicione, edite ou remova as opções de borda recheada para as pizzas (ex: Catupiry, Cheddar, Chocolate).
            Defina nome, descrição, preços por tamanho e status para cada tipo de borda.
          </CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da borda..."
              className="pl-8 w-full md:w-1/2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Carregando opções de borda...</p>
            </div>
          ) : filteredBordas.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Borda</TableHead>
                    <TableHead className="text-center">Preço (P)</TableHead>
                    <TableHead className="text-center">Preço (G)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBordas.map((borda) => (
                    <TableRow key={borda.id}>
                      <TableCell className="font-medium">{borda.nome}</TableCell>
                      {/* Assuming borda object now directly has preco_pequena and preco_grande */}
                      <TableCell className="text-center">R$ {(borda.preco_pequena ?? 0).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="text-center">R$ {(borda.preco_grande ?? 0).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={borda.ativo ? 'default' : 'outline'} className="cursor-default">
                            {borda.ativo ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                            {borda.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/admin/bordas-pizza/${borda.id}/editar`}>
                          <Button variant="ghost" size="icon" title="Editar Borda" disabled={isSubmitting}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleOpenDeleteDialog(borda)} title="Excluir Borda" disabled={isSubmitting}>
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
              {searchTerm ? `Nenhuma opção de borda encontrada com o termo "${searchTerm}".` : "Nenhuma opção de borda cadastrada."}
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
              Tem certeza que deseja excluir a opção de borda "{bordaToDelete?.nome}"?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBordaToDelete(null)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
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

