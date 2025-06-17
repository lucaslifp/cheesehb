
"use client";

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { OrderAdmin, OrderStatusAdmin, ProdutoAdmin } from '@/types';
import { orderStatusAdmin as ALL_STATUSES } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant, formatTimeDifference } from '@/lib/admin-utils';
import { Printer, Save, X, Edit, MessageSquareText, Undo, User, Phone, Trash2, PlusCircle, SearchIcon, AlertTriangle, Loader2, FileText, PackageOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart'; 
import { format, parseISO } from 'date-fns';

interface OrderDetailPanelProps {
  order: OrderAdmin | null;
  onUpdateOrder: (updatedOrder: OrderAdmin) => void;
}

export function OrderDetailPanel({ order, onUpdateOrder }: OrderDetailPanelProps) {
  const { produtos: allStoreProducts } = useCart(); 
  const [isEditing, setIsEditing] = useState(false);
  const [editableOrderData, setEditableOrderData] = useState<OrderAdmin | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ProdutoAdmin[]>([]);
  const [currentWaitTime, setCurrentWaitTime] = useState<{ text: string; isOverdue: boolean }>({ text: 'N/A', isOverdue: false });


  const availableProductsForAdding = useMemo(() => {
    const currentItemNames = editableOrderData?.itens.map(item => item.nomeProduto.toLowerCase()) || [];
    return allStoreProducts.filter(p => 
      !p.is_personalizable_pizza && 
      p.ativo && 
      p.mostrar_no_cardapio &&
      !currentItemNames.includes(p.nome.toLowerCase())
    );
  }, [allStoreProducts, editableOrderData?.itens]);

  useEffect(() => {
    if (order) {
      setEditableOrderData(JSON.parse(JSON.stringify(order))); 
      setCurrentWaitTime(formatTimeDifference(order.timestamp));
    } else {
      setEditableOrderData(null);
      setCurrentWaitTime({ text: 'N/A', isOverdue: false });
    }
    setIsEditing(false); 
    setIsUpdatingStatus(false);
    setIsSavingDetails(false);
    setSearchTerm('');
    setFilteredProducts([]);
  }, [order]);
  
  useEffect(() => {
    if (searchTerm.trim().length > 1 && isEditing) {
      const searchResults = availableProductsForAdding.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(searchResults.slice(0, 5)); 
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, availableProductsForAdding, isEditing]);
  
  useEffect(() => {
    if (order && order.status !== 'Entregue' && order.status !== 'Cancelado') {
      const intervalId = setInterval(() => {
        setCurrentWaitTime(formatTimeDifference(order.timestamp));
      }, 60000); // Update every minute
      return () => clearInterval(intervalId);
    }
  }, [order]);


  if (!order || !editableOrderData) {
    return (
      <Card className="h-full flex flex-col items-center justify-center rounded-none md:rounded-l-none shadow-none md:shadow-sm">
        <CardHeader className="text-center">
            <PackageOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="text-xl">Nenhum Pedido Selecionado</CardTitle>
          <CardDescription>Clique em um pedido na lista para ver seus detalhes.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handlePrint = () => {
    toast({
      title: "Impressão Solicitada (Simulação)",
      description: `O pedido ${order.order_number} seria enviado para impressão.`,
    });
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setEditableOrderData(JSON.parse(JSON.stringify(order))); 
      setSearchTerm('');
      setFilteredProducts([]);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!editableOrderData) return;
    setIsSavingDetails(true);
    const payload = {
      cliente_nome: editableOrderData.cliente.nome,
      cliente_telefone: editableOrderData.cliente.telefone,
      observacoes_cliente: editableOrderData.cliente.observacoes || null, 
    };
    try {
      const response = await fetch(`/api/admin/pedidos/${editableOrderData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao salvar alterações do pedido ${editableOrderData.order_number}.`);
      }
      const updatedOrderFromServerRaw = await response.json();
      const updatedOrderForState: OrderAdmin = {
        ...editableOrderData, 
        cliente: { ...editableOrderData.cliente, nome: updatedOrderFromServerRaw.cliente_nome, telefone: updatedOrderFromServerRaw.cliente_telefone, observacoes: updatedOrderFromServerRaw.observacoes_cliente },
        timestamp: updatedOrderFromServerRaw.updated_at ? format(parseISO(updatedOrderFromServerRaw.updated_at), 'dd/MM/yyyy, HH:mm:ss') : editableOrderData.timestamp,
        order_number: updatedOrderFromServerRaw.order_number,
      };
      setEditableOrderData(updatedOrderForState);
      onUpdateOrder(updatedOrderForState);
      toast({ title: "Alterações Salvas!", description: `Detalhes do pedido ${updatedOrderForState.order_number} foram atualizados.` });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingDetails(false);
      setSearchTerm('');
      setFilteredProducts([]);
    }
  };

  const handleInputChange = (field: keyof OrderAdmin['cliente'], value: string) => {
    setEditableOrderData(prev => prev ? { ...prev, cliente: { ...prev.cliente, [field]: value } } : null);
  };
  
  const handleTextareaChange = (field: 'observacoes', value: string) => {
     setEditableOrderData(prev => prev ? { ...prev, cliente: { ...prev.cliente, [field]: value } } : null);
  };

  const handleStatusChangeApi = async (newStatus: OrderStatusAdmin) => {
     if (!editableOrderData) return;
     setIsUpdatingStatus(true);
     try {
        const response = await fetch(`/api/admin/pedidos/${editableOrderData.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Falha ao atualizar status do pedido ${editableOrderData.order_number}.`);
        }
        const updatedOrderFromServer = await response.json();
        const updatedOrderForState: OrderAdmin = {
            ...editableOrderData, status: updatedOrderFromServer.status_pedido, 
            timestamp: format(new Date(updatedOrderFromServer.updated_at), 'dd/MM/yyyy, HH:mm:ss'),
            order_number: updatedOrderFromServer.order_number,
        };
        setEditableOrderData(updatedOrderForState);
        onUpdateOrder(updatedOrderForState); 
        toast({ title: "Status Alterado!", description: `Status do Pedido ${updatedOrderFromServer.order_number} alterado para ${newStatus}.` });
     } catch (error: any) {
        toast({ title: "Erro ao Alterar Status", description: error.message, variant: "destructive" });
     } finally {
        setIsUpdatingStatus(false);
     }
  };

  const handleRemoveItem = (itemIndex: number) => {
    setEditableOrderData(prev => {
      if (!prev) return null;
      const newItems = [...prev.itens]; newItems.splice(itemIndex, 1);
      return { ...prev, itens: newItems };
    });
  };

  const handleAddProduct = (productToAdd: ProdutoAdmin) => {
    setEditableOrderData(prev => {
      if (!prev) return null;
      const newItem: OrderAdminItem = { nomeProduto: productToAdd.nome, quantidade: 1, precoUnitario: productToAdd.preco_base, precoTotalItem: productToAdd.preco_base };
      return { ...prev, itens: [...prev.itens, newItem] };
    });
    setSearchTerm(''); setFilteredProducts([]);
  };

  const statusBadge = getStatusBadgeVariant(editableOrderData.status);

  return (
    <Card className="h-full flex flex-col rounded-none md:rounded-l-none shadow-none md:shadow-sm">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-headline">Pedido: {order.order_number}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleEdit} disabled={isUpdatingStatus || isSavingDetails}>
              {isEditing ? <><Undo className="mr-2 h-3 w-3" /> Cancelar Ed.</> : <><Edit className="mr-2 h-3 w-3" /> Editar</>}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={isUpdatingStatus || isSavingDetails}><Printer className="mr-2 h-3 w-3" /> Imprimir</Button>
          </div>
        </div>
        <CardDescription className="text-xs">
            {isEditing ? "Editando detalhes do pedido." : `Recebido ${editableOrderData.timestamp} (${currentWaitTime.text})`}
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0">
        <CardContent className="p-4 space-y-4">
            <section>
              <h3 className="text-md font-semibold mb-1.5 text-primary">Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div><Label htmlFor="clienteNomePanel" className="font-medium flex items-center mb-0.5"><User className="mr-1 h-3 w-3"/>Nome:</Label>
                  {isEditing ? <Input id="clienteNomePanel" value={editableOrderData.cliente.nome} onChange={(e) => handleInputChange('nome', e.target.value)} className="text-xs h-7" disabled={isSavingDetails}/> : <p>{editableOrderData.cliente.nome}</p>}
                </div>
                <div><Label htmlFor="clienteTelefonePanel" className="font-medium flex items-center mb-0.5"><Phone className="mr-1 h-3 w-3"/>Telefone:</Label>
                   {isEditing ? <Input id="clienteTelefonePanel" value={editableOrderData.cliente.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} className="text-xs h-7" disabled={isSavingDetails}/> : <p>{editableOrderData.cliente.telefone}</p>}
                </div>
                {editableOrderData.cliente.endereco && <p className="sm:col-span-2"><strong className="font-medium">Endereço:</strong> {editableOrderData.cliente.endereco}{editableOrderData.cliente.complemento ? `, ${editableOrderData.cliente.complemento}` : ''}</p>}
                {editableOrderData.cliente.bairro && <p><strong className="font-medium">Bairro:</strong> {editableOrderData.cliente.bairro}</p>}
              </div>
              <div className="mt-2 space-y-0.5"><Label htmlFor="clienteObservacoesPanel" className="font-medium flex items-start text-xs"><MessageSquareText className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-blue-600" />Obs. (Cliente):</Label>
                {isEditing ? <Textarea id="clienteObservacoesPanel" value={editableOrderData.cliente.observacoes || ''} onChange={(e) => handleTextareaChange('observacoes', e.target.value)} placeholder="Observações do cliente..." className="text-xs min-h-[40px]" disabled={isSavingDetails}/>
                 : (editableOrderData.cliente.observacoes ? <p className="text-xs pl-4">{editableOrderData.cliente.observacoes}</p> : <p className="text-xs text-muted-foreground pl-4">Nenhuma.</p>)}
              </div>
            </section>
            <Separator/>
            <section><h3 className="text-md font-semibold mb-1.5 text-primary">Status</h3>
               <div className="flex items-center gap-2 text-xs">
                  <Label htmlFor="statusPedidoPanel" className="font-medium">Status Atual:</Label>
                  {isEditing ? (
                      <Select value={editableOrderData.status} onValueChange={(value: OrderStatusAdmin) => handleStatusChangeApi(value)} disabled={isUpdatingStatus || isSavingDetails}>
                        <SelectTrigger id="statusPedidoPanel" className={cn("w-[160px] h-7 text-xs", (isUpdatingStatus || isSavingDetails) && "opacity-70")}><SelectValue placeholder="Alterar status" />{(isUpdatingStatus || isSavingDetails) && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}</SelectTrigger>
                        <SelectContent>{ALL_STATUSES.map(status => (<SelectItem key={status} value={status} className="text-xs"><Badge variant={getStatusBadgeVariant(status).variant} className={cn(getStatusBadgeVariant(status).className, "mr-2 w-full justify-start text-xs px-1.5 py-0.5")}>{status}</Badge></SelectItem>))}</SelectContent>
                      </Select>
                    ) : (<Badge variant={statusBadge.variant} className={cn(statusBadge.className, "text-xs px-1.5 py-0.5")}>{editableOrderData.status}</Badge>)}
               </div>
            </section>
            <Separator/>
            <section>
              <div className="flex justify-between items-center mb-1.5"><h3 className="text-md font-semibold text-primary">Itens do Pedido</h3></div>
              {isEditing && <Alert variant="default" className="mb-2 bg-amber-50 border-amber-400 text-amber-700 text-xs p-2"><AlertTriangle className="h-3 w-3 !text-amber-600" /><AlertDescription className="text-xs leading-tight">Atenção! Adição/remoção de itens aqui é simulada e não recalcula totais. Personalização detalhada de itens (sabores, etc.) não está disponível aqui.</AlertDescription></Alert>}
              <div className="space-y-2">
                {editableOrderData.itens.map((item, index) => (
                  <div key={`item-panel-${index}-${item.nomeProduto}`} className="p-2 border rounded-md bg-muted/30 relative text-xs">
                    {isEditing && <Button variant="ghost" size="icon" className="absolute top-0.5 right-0.5 h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => handleRemoveItem(index)} title="Remover Item" disabled={isSavingDetails}><Trash2 className="h-3 w-3" /></Button>}
                    <p className="font-semibold">{item.quantidade}x {item.nomeProduto}</p>
                    <p className="text-xs text-muted-foreground">Unitário: R$ {item.precoUnitario.toFixed(2).replace('.', ',')} | Total Item: R$ {item.precoTotalItem.toFixed(2).replace('.', ',')}</p>
                    {item.sabores && <p className="text-xs text-muted-foreground">Sabores: {item.sabores}</p>}
                    {item.borda && <p className="text-xs text-muted-foreground">Borda: {item.borda}</p>}
                    {item.adicionais && item.adicionais.length > 0 && (<div className="mt-0.5"><p className="text-xs font-medium">Adicionais Cobertura:</p><ul className="list-disc list-inside pl-2 text-xs text-muted-foreground">{item.adicionais.map((ad, adIndex) => <li key={adIndex}>{ad.quantidade}x {ad.nome} (+R$ {ad.preco.toFixed(2).replace('.', ',')})</li>)}</ul></div>)}
                    {item.opcionais && item.opcionais.length > 0 && (<div className="mt-0.5"><p className="text-xs font-medium">Opcionais do Produto:</p><ul className="list-disc list-inside pl-2 text-xs text-muted-foreground">{item.opcionais.map((op, opIndex) => <li key={`${op.grupo_id}-${op.item_id}-${opIndex}`}>{op.grupo_nome}: {op.item_nome} {op.item_preco_adicional > 0 ? `(+R$ ${(op.item_preco_adicional * op.quantidade).toFixed(2).replace('.', ',')})` : ''}</li>)}</ul></div>)}
                    {item.observacoesItem && (<p className="text-xs text-muted-foreground mt-0.5 flex items-start"><MessageSquareText className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-blue-500" /><strong className="font-medium mr-1">Obs. Item:</strong> {item.observacoesItem}</p>)}
                  </div>
                ))}
              </div>
              {isEditing && (<div className="mt-3 space-y-1"><Label htmlFor="addProductSearchPanel" className="font-medium flex items-center text-xs"><PlusCircle className="mr-1 h-3 w-3" /> Adicionar Produto (Simulado)</Label><div className="relative"><SearchIcon className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" /><Input id="addProductSearchPanel" type="text" placeholder="Buscar produtos (não-pizzas)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 h-7 text-xs" disabled={isSavingDetails}/></div>
                {filteredProducts.length > 0 && (<ScrollArea className="max-h-24 border rounded-md"><div className="p-1">{filteredProducts.map(p => (<Button key={p.id} variant="ghost" className="w-full justify-start text-xs h-auto py-1 px-1.5" onClick={() => handleAddProduct(p)} disabled={isSavingDetails}>{p.nome} <span className="ml-auto text-xs text-muted-foreground">R$ {p.preco_base.toFixed(2).replace('.',',')}</span></Button>))}</div></ScrollArea>)}
              </div>)}
            </section>
            <Separator/>
            <section><h3 className="text-md font-semibold mb-1.5 text-primary">Financeiro</h3>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between"><span>Subtotal:</span> <span>R$ {editableOrderData.subtotal.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Taxa de Entrega:</span> <span>R$ {editableOrderData.taxaEntrega.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between font-bold text-sm"><span>TOTAL:</span> <span>R$ {editableOrderData.total.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Forma de Pagamento:</span> <span>{editableOrderData.formaPagamento}</span></div>
              </div>
              {isEditing && (<p className="text-xs text-muted-foreground mt-1">Lembre-se: A edição de itens acima não atualiza estes totais automaticamente.</p>)}
            </section>
        </CardContent>
      </ScrollArea>
      {isEditing && (
        <CardFooter className="px-4 py-2 border-t">
          <Button variant="default" onClick={handleSaveChanges} className="w-full" size="sm" disabled={isUpdatingStatus || isSavingDetails}>
            {isSavingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSavingDetails ? "Salvando..." : "Salvar Detalhes do Cliente e Observações"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
