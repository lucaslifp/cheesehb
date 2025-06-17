
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ArrowLeft, Edit, Trash2, Search, Eye, EyeOff, Loader2, Truck } from 'lucide-react';
import type { Database } from '@/types/supabase'; // Using Supabase generated types
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

// Directly use the Supabase generated type for a row in the 'bairros_entrega' table
type BairroEntregaRow = Database["public"]["Tables"]["bairros_entrega"]["Row"];

export default function AdminBairrosFretePage() {
  const [bairros, setBairros] = useState<BairroEntregaRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bairroToDelete, setBairroToDelete] = useState<BairroEntregaRow | null>(null);

  const fetchBairros = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bairros-entrega');
      if (!response.ok) {
        let errorDetail = 'Falha ao buscar bairros e taxas de frete.';
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
      const data: BairroEntregaRow[] = await response.json();
      setBairros(data.map(b => ({...b, ativo: b.ativo === null ? true : b.ativo})).sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error: any) {
      console.error("Erro ao carregar bairros:", error);
      toast({ title: "Erro", description: error.message || "Não foi possível carregar os bairros e taxas de frete.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBairros();
  }, []);

  const handleOpenDeleteDialog = (bairro: BairroEntregaRow) => {
    setBairroToDelete(bairro);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bairroToDelete) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/bairros-entrega/${bairroToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao excluir o bairro/área.';
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
      
      await fetchBairros(); 
      toast({ title: "Bairro/Área Excluído!", description: `O bairro/área "${bairroToDelete.nome}" foi excluído.` });
    } catch (error: any) {
      toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setBairroToDelete(null);
    }
  };

  const filteredBairros = useMemo(() => {
    return bairros.filter(bairro =>
      bairro.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bairros, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Bairros e Taxas de Entrega</h1>
        <Link href="/admin/bairros-e-frete/novo" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Bairro/Área
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Áreas e Taxas de Entrega</CardTitle>
          <CardDescription>
            Defina os bairros atendidos pela sua loja, as respectivas taxas de frete e, opcionalmente, os tempos estimados de entrega.
            Estas configurações serão usadas no carrinho e checkout.
          </CardDescription>
           <div className="mt-4 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do bairro..."
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
                <p className="ml-2">Carregando bairros...</p>
            </div>
          ) : filteredBairros.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Bairro/Área</TableHead>
                    <TableHead className="text-center">Taxa de Frete (R$)</TableHead>
                    <TableHead className="text-center">Tempo Estimado (min)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBairros.map((bairro) => (
                    <TableRow key={bairro.id}>
                      <TableCell className="font-medium">{bairro.nome}</TableCell>
                      <TableCell className="text-center">R$ {bairro.taxa_entrega.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="text-center">{bairro.tempo_estimado_entrega_minutos || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={bairro.ativo ? 'default' : 'outline'} className="cursor-default">
                            {bairro.ativo ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                            {bairro.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/admin/bairros-e-frete/${bairro.id}/editar`}>
                          <Button variant="ghost" size="icon" title="Editar Bairro" disabled={isSubmitting}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleOpenDeleteDialog(bairro)} title="Excluir Bairro" disabled={isSubmitting}>
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
              {searchTerm ? `Nenhum bairro encontrado com o termo "${searchTerm}".` : "Nenhum bairro/área de entrega cadastrado."}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o bairro/área "{bairroToDelete?.nome}"?
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBairroToDelete(null)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
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
