
"use client";

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Search, Users, ArrowLeft, BellOff, Bell, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { ClienteAdmin } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const formatPhoneNumber = (value: string): string => {
  if (!value) return value;
  const phoneNumber = value.replace(/\D/g, '');
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 3) return `(${phoneNumber}`;
  if (phoneNumberLength < 8) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  if (phoneNumberLength === 10) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
  if (phoneNumberLength === 11) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  if (phoneNumberLength > 11) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  return value;
};

const clienteFormSchema = z.object({
  nome: z.string().min(2, "O nome completo deve ter pelo menos 2 caracteres."),
  telefone: z.string().trim().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato de telefone inválido. Ex: (XX) XXXXX-XXXX"),
  nao_receber_promocoes: z.boolean().default(false),
});
type ClienteFormValues = z.infer<typeof clienteFormSchema>;


export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAddClienteDialogOpen, setIsAddClienteDialogOpen] = useState(false);
  const [isEditClienteDialogOpen, setIsEditClienteDialogOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState<ClienteAdmin | null>(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<ClienteAdmin | null>(null);

  const [isUpdatingPromocoes, setIsUpdatingPromocoes] = useState<Record<string, boolean>>({});


  const addForm = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      nao_receber_promocoes: false,
    },
  });

  const editForm = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
  });

  useEffect(() => {
    if (clienteToEdit && isEditClienteDialogOpen) {
      editForm.reset({
        nome: clienteToEdit.nome,
        telefone: clienteToEdit.telefone,
        nao_receber_promocoes: clienteToEdit.nao_receber_promocoes || false,
      });
    }
  }, [clienteToEdit, isEditClienteDialogOpen, editForm]);


  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/clientes');
      if (!response.ok) {
        const errorText = await response.text(); 
        let errorDetails = `Status: ${response.status}. Resposta da API: ${errorText.substring(0, 500)}${errorText.length > 500 ? '...' : ''}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson && errorJson.error) {
            errorDetails = errorJson.error;
          }
        } catch (e) {
          // If JSON.parse fails, errorDetails already contains the raw text
        }
        console.error("Falha ao buscar clientes. Detalhes:", errorDetails);
        throw new Error(`Falha ao buscar clientes. ${errorDetails}`);
      }
      const data: ClienteAdmin[] = await response.json();
      setClientes(data);
    } catch (error: any) {
      console.error("Erro ao carregar clientes:", error);
      toast({ title: "Erro ao Carregar Clientes", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleAddClienteSubmit: SubmitHandler<ClienteFormValues> = async (values) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao adicionar cliente.`);
      }
      toast({ title: "Cliente Adicionado!", description: `O cliente "${values.nome}" foi adicionado com sucesso.` });
      setIsAddClienteDialogOpen(false);
      addForm.reset();
      await fetchClientes();
    } catch (error: any) {
      toast({ title: "Erro ao Adicionar Cliente", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClienteSubmit: SubmitHandler<ClienteFormValues> = async (values) => {
    if (!clienteToEdit || !clienteToEdit.id) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/clientes/${clienteToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao atualizar cliente.`);
      }
      toast({ title: "Cliente Atualizado!", description: `Os dados de "${values.nome}" foram atualizados.` });
      setIsEditClienteDialogOpen(false);
      await fetchClientes();
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar Cliente", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenDeleteDialog = (cliente: ClienteAdmin) => {
    setClienteToDelete(cliente);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clienteToDelete || !clienteToDelete.id) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/clientes/${clienteToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        let errorDetail = 'Falha ao excluir cliente.';
        try {
          // Tenta ler a resposta como texto primeiro, pois pode ser HTML
          const errorText = await response.text();
          // console.error("Raw error response from DELETE API:", errorText); // Log para depuração
          // Tenta parsear como JSON, se falhar, usa o texto bruto
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            errorDetail = errorData.error;
          } else {
            errorDetail = `Falha ao excluir. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
        } catch (parseError) {
          // Se JSON.parse falhar, significa que a resposta não era JSON válido (provavelmente HTML)
          // Precisamos obter o texto novamente se a tentativa anterior de response.text() não foi armazenada
          // No entanto, a primeira response.text() já deveria ter capturado.
          // Para garantir, podemos tentar ler novamente, mas pode dar erro se o corpo já foi lido.
          // Uma forma mais segura seria capturar errorText fora do try/catch de JSON.parse.
          // Por agora, vamos assumir que o errorText já foi capturado acima se response.text() teve sucesso.
          // Se errorText não foi capturado (ex, se response.text() ele mesmo falhou), esta é uma fallback:
          let fallbackErrorText = 'Resposta do servidor não é JSON válido.';
          try {
            // Tenta reler o corpo SÓ se a primeira tentativa de ler errorText não aconteceu ou falhou
            // (Como está agora, errorText é lido antes do JSON.parse, então está ok)
            // const newErrorText = await response.text(); // Não é seguro reler o corpo
            // fallbackErrorText = newErrorText.substring(0, 200) + (newErrorText.length > 200 ? '...' : '');
          } catch (e) { /* ignore, corpo já pode ter sido lido */ }
          errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}. Resposta: ${fallbackErrorText}`;
        }
        throw new Error(errorDetail);
      }
      toast({ title: "Cliente Excluído!", description: `O cliente "${clienteToDelete.nome}" foi excluído.` });
      await fetchClientes();
    } catch (error: any) {
      toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };
  
  const isManualCliente = (c: ClienteAdmin): boolean => {
    // console.log(`Client Render: Name: ${c.nome}, ID: ${c.id}, Fonte: ${c.fonte}, IsManual: ${c.fonte === 'manual' && typeof c.id === 'string' && c.id.length === 36}`);
    return c.fonte === 'manual' && typeof c.id === 'string' && c.id.length === 36; 
  };
  
  const handleTogglePromocoes = async (cliente: ClienteAdmin) => {
    if (!isManualCliente(cliente) || !cliente.id) {
      toast({
        title: "Ação Não Permitida",
        description: "O status de promoções para clientes não cadastrados manualmente não pode ser alterado aqui.",
        variant: "default"
      });
      return;
    }
    // console.log("Attempting to toggle promo for client:", cliente.id, "New nao_receber_promocoes:", !cliente.nao_receber_promocoes);

    setIsUpdatingPromocoes(prev => ({ ...prev, [cliente.id!]: true }));
    try {
      const response = await fetch(`/api/admin/clientes/${cliente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nao_receber_promocoes: !cliente.nao_receber_promocoes }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar status de promoções.');
      }
      toast({ title: "Status de Promoções Atualizado!", description: `Cliente "${cliente.nome}" ${!cliente.nao_receber_promocoes ? "não receberá" : "receberá"} promoções.` });
      await fetchClientes(); 
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingPromocoes(prev => ({ ...prev, [cliente.id!]: false }));
    }
  };


  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.telefone && cliente.telefone.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => a.nome.localeCompare(b.nome));
  }, [clientes, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center"><Users className="mr-3 h-8 w-8"/>Gerenciar Clientes</h1>
        <Button onClick={() => {addForm.reset(); setIsAddClienteDialogOpen(true);}} >
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Visualize clientes (cadastrados ou derivados de pedidos). Adicione novos ou gerencie existentes.
          </CardDescription>
          <div className="mt-4 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
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
              <p className="ml-2">Carregando clientes...</p>
            </div>
          ) : filteredClientes.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-center">Total Pedidos</TableHead>
                    <TableHead>Último Pedido</TableHead>
                    <TableHead className="text-center">Promoções</TableHead>
                    <TableHead className="text-right w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => {
                    const manualCliente = isManualCliente(cliente);
                    return (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>{cliente.telefone}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{cliente.totalPedidos || 0}</Badge>
                        </TableCell>
                        <TableCell>{cliente.ultimoPedido || 'N/A'}</TableCell>
                        <TableCell className="text-center">
                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={cliente.nao_receber_promocoes ? "outline" : "default"}
                                  className={manualCliente ? "cursor-pointer hover:opacity-80" : "cursor-default"}
                                  onClick={() => {
                                    if (manualCliente && !isUpdatingPromocoes[cliente.id!] && !isSubmitting) {
                                      handleTogglePromocoes(cliente);
                                    } else if (!manualCliente) {
                                      toast({
                                        title: "Ação Não Permitida",
                                        description: "O status de promoções para clientes não cadastrados manualmente não pode ser alterado aqui.",
                                        variant: "default"
                                      });
                                    }
                                  }}
                                  aria-disabled={!manualCliente || isUpdatingPromocoes[cliente.id!] || isSubmitting}
                                >
                                  {isUpdatingPromocoes[cliente.id!] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : (cliente.nao_receber_promocoes ? <BellOff className="mr-1 h-3 w-3" /> : <Bell className="mr-1 h-3 w-3" />)}
                                  {cliente.nao_receber_promocoes ? 'Não Recebe' : 'Recebe'}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {manualCliente
                                    ? (cliente.nao_receber_promocoes ? "Optou por não receber" : "Aceita receber") + " (clique para alterar)"
                                    : "Status de promoção não gerenciável (cliente derivado de pedido ou sem ID manual)"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (manualCliente) {
                                        setClienteToEdit(cliente);
                                        setIsEditClienteDialogOpen(true);
                                    }
                                  }}
                                  disabled={!manualCliente || isSubmitting || isUpdatingPromocoes[cliente.id!]}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>{manualCliente ? "Editar Cliente" : "Edição não disponível (cliente não manual)"}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive/80"
                                  onClick={() => {
                                    if (manualCliente) {
                                        handleOpenDeleteDialog(cliente);
                                    }
                                  }}
                                  disabled={!manualCliente || isSubmitting || isUpdatingPromocoes[cliente.id!]}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>{manualCliente ? "Excluir Cliente" : "Exclusão não disponível (cliente não manual)"}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? `Nenhum cliente encontrado com o termo "${searchTerm}".` : "Nenhum cliente cadastrado."}
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

      <Dialog open={isAddClienteDialogOpen} onOpenChange={(open) => {
        setIsAddClienteDialogOpen(open);
        if (!open) addForm.reset();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            <DialogDescription>Insira os dados do novo cliente.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddClienteSubmit)} className="space-y-4 py-4">
              <FormField
                control={addForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="(XX) XXXXX-XXXX" 
                        {...field}
                        onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                        maxLength={15}
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="nao_receber_promocoes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Opta por NÃO receber notificações/promoções</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Cliente
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditClienteDialogOpen} onOpenChange={(open) => {
          setIsEditClienteDialogOpen(open);
          if (!open) setClienteToEdit(null); 
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Altere os dados do cliente abaixo.</DialogDescription>
          </DialogHeader>
          {clienteToEdit && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditClienteSubmit)} className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="(XX) XXXXX-XXXX" 
                          {...field}
                          onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="nao_receber_promocoes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Opta por NÃO receber notificações/promoções</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clienteToDelete?.nome}" da lista de clientes manuais?
              Os registros de pedidos feitos por este cliente não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClienteToDelete(null)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
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
    

    