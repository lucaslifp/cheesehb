
"use client";

// ESTE ARQUIVO NÃO É MAIS USADO DIRETAMENTE PELA PÁGINA DE LISTAGEM DE PEDIDOS.
// FOI SUBSTITUÍDO POR OrderDetailPanel.tsx.
// PODE SER REMOVIDO FUTURAMENTE OU REUTILIZADO SE NECESSÁRIO UM MODAL SEPARADO.

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { OrderAdmin, OrderStatusAdmin, ProdutoAdmin, OrderAdminItem, CategoriaAdmin } from '@/types';
import { orderStatusAdmin as ALL_STATUSES } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/admin-utils';
import { Printer, Save, X, Edit, MessageSquareText, Undo, User, Phone, Trash2, PlusCircle, SearchIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/hooks/use-cart'; 
import { format, parseISO } from 'date-fns';

interface OrderDetailEditModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: OrderAdmin | null;
  onUpdateOrder: (updatedOrder: OrderAdmin) => void;
}

export function OrderDetailEditModal({ isOpen, onOpenChange, order, onUpdateOrder }: OrderDetailEditModalProps) {
  const { produtos: allStoreProducts } = useCart(); 
  const [isEditing, setIsEditing] = useState(false);
  const [editableOrderData, setEditableOrderData] = useState<OrderAdmin | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ProdutoAdmin[]>([]);

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
    }
    setIsEditing(false); 
    setIsUpdatingStatus(false);
    setIsSavingDetails(false);
    setSearchTerm('');
    setFilteredProducts([]);
  }, [order, isOpen]);
  
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

  if (!order || !editableOrderData) return null;

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
        cliente: { 
            ...editableOrderData.cliente,
            nome: updatedOrderFromServerRaw.cliente_nome,
            telefone: updatedOrderFromServerRaw.cliente_telefone,
            observacoes: updatedOrderFromServerRaw.observacoes_cliente,
        },
        timestamp: updatedOrderFromServerRaw.updated_at ? format(parseISO(updatedOrderFromServerRaw.updated_at), 'dd/MM/yyyy, HH:mm:ss') : editableOrderData.timestamp,
        order_number: updatedOrderFromServerRaw.order_number, 
      };


      setEditableOrderData(updatedOrderForState);
      onUpdateOrder(updatedOrderForState);
      toast({
        title: "Alterações Salvas!",
        description: `Detalhes do pedido ${updatedOrderForState.order_number} foram atualizados.`,
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Erro ao Salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingDetails(false);
      setSearchTerm('');
      setFilteredProducts([]);
    }
  };


  const handleInputChange = (field: keyof OrderAdmin['cliente'], value: string) => {
    setEditableOrderData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cliente: {
          ...prev.cliente,
          [field]: value,
        },
      };
    });
  };
  
  const handleTextareaChange = (field: 'observacoes', value: string) => {
     setEditableOrderData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cliente: {
            ...prev.cliente,
            [field]: value
        }
      };
    });
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
            ...editableOrderData,
            status: updatedOrderFromServer.status_pedido,
            timestamp: format(new Date(updatedOrderFromServer.updated_at), 'dd/MM/yyyy, HH:mm:ss'),
            order_number: updatedOrderFromServer.order_number, 
        };
        setEditableOrderData(updatedOrderForState);
        onUpdateOrder(updatedOrderForState); 
        toast({
            title: "Status Alterado!",
            description: `Status do Pedido ${updatedOrderFromServer.order_number} alterado para ${newStatus}.`,
        });

     } catch (error: any) {
        toast({
            title: "Erro ao Alterar Status",
            description: error.message,
            variant: "destructive",
        });
     } finally {
        setIsUpdatingStatus(false);
     }
  };

  const handleRemoveItem = (itemIndex: number) => {
    setEditableOrderData(prev => {
      if (!prev) return null;
      const newItems = [...prev.itens];
      newItems.splice(itemIndex, 1);
      return { ...prev, itens: newItems };
    });
  };

  const handleAddProduct = (productToAdd: ProdutoAdmin) => {
    setEditableOrderData(prev => {
      if (!prev) return null;
      const newItem: OrderAdminItem = {
        nomeProduto: productToAdd.nome,
        quantidade: 1,
        precoUnitario: productToAdd.preco_base, 
        precoTotalItem: productToAdd.preco_base,
      };
      return { ...prev, itens: [...prev.itens, newItem] };
    });
    setSearchTerm(''); 
    setFilteredProducts([]);
  };

  const statusBadge = getStatusBadgeVariant(editableOrderData.status);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) { 
        setIsEditing(false);
        setSearchTerm('');
        setFilteredProducts([]);
      }
    }}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Detalhes do Pedido: {order.order_number}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Edite os detalhes do pedido abaixo." : "Visualize os detalhes deste pedido."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0" type="auto">
          <div className="space-y-6 py-4">
            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <Label htmlFor="clienteNomeModal" className="font-medium flex items-center mb-1"><User className="mr-1 h-4 w-4"/>Nome:</Label>
                  {isEditing ? (
                    <Input
                      id="clienteNomeModal"
                      value={editableOrderData.cliente.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                      className="text-sm h-8"
                      disabled={isSavingDetails}
                    />
                  ) : (
                    <p>{editableOrderData.cliente.nome}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="clienteTelefoneModal" className="font-medium flex items-center mb-1"><Phone className="mr-1 h-4 w-4"/>Telefone:</Label>
                   {isEditing ? (
                    <Input
                      id="clienteTelefoneModal"
                      value={editableOrderData.cliente.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      className="text-sm h-8"
                      disabled={isSavingDetails}
                    />
                  ) : (
                    <p>{editableOrderData.cliente.telefone}</p>
                  )}
                </div>
                {editableOrderData.cliente.endereco && (
                  <p className="md:col-span-2"><strong className="font-medium">Endereço:</strong> {editableOrderData.cliente.endereco}{editableOrderData.cliente.complemento ? `, ${editableOrderData.cliente.complemento}` : ''}</p>
                )}
                {editableOrderData.cliente.bairro && (
                  <p><strong className="font-medium">Bairro:</strong> {editableOrderData.cliente.bairro}</p>
                )}
              </div>
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="clienteObservacoesModal" className="font-medium flex items-start">
                    <MessageSquareText className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0 text-blue-600" />
                  Obs. (Cliente):
                </Label>
                {isEditing ? (
                  <Textarea
                    id="clienteObservacoesModal"
                    value={editableOrderData.cliente.observacoes || ''}
                    onChange={(e) => handleTextareaChange('observacoes', e.target.value)}
                    placeholder="Observações do cliente sobre o pedido..."
                    className="text-sm min-h-[60px]"
                    disabled={isSavingDetails}
                  />
                ) : (
                  editableOrderData.cliente.observacoes ? (
                    <p className="text-sm pl-5">{editableOrderData.cliente.observacoes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-5">Nenhuma observação do cliente.</p>
                  )
                )}
              </div>
            </section>
            <Separator/>

            <section>
               <h3 className="text-lg font-semibold mb-2 text-primary">Status e Data</h3>
               <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="statusPedidoModal" className="font-medium">Status Atual:</Label>
                    {isEditing ? (
                      <Select 
                        value={editableOrderData.status} 
                        onValueChange={(value: OrderStatusAdmin) => handleStatusChangeApi(value)}
                        disabled={isUpdatingStatus || isSavingDetails}
                      >
                        <SelectTrigger id="statusPedidoModal" className={cn("w-[180px] h-8 text-xs", (isUpdatingStatus || isSavingDetails) && "opacity-70")}>
                          <SelectValue placeholder="Alterar status" />
                           {(isUpdatingStatus || isSavingDetails) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map(status => (
                            <SelectItem key={status} value={status} className="text-xs">
                              <Badge variant={getStatusBadgeVariant(status).variant} className={cn(getStatusBadgeVariant(status).className, "mr-2 w-full justify-start")}>{status}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={statusBadge.variant} className={cn(statusBadge.className)}>{editableOrderData.status}</Badge>
                    )}
                  </div>
                  <p><strong className="font-medium">Data/Hora:</strong> {editableOrderData.timestamp}</p>
               </div>
            </section>
            <Separator/>

            <section>
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-lg font-semibold text-primary">Itens do Pedido</h3>
              </div>
              {isEditing && (
                <Alert variant="default" className="mb-3 bg-amber-50 border-amber-400 text-amber-700">
                  <AlertTriangle className="h-4 w-4 !text-amber-600" />
                  <AlertTitle className="font-semibold">Atenção!</AlertTitle>
                  <AlertDescription className="text-xs">
                    A adição ou remoção de itens aqui é simulada e não recalcula totais. A personalização detalhada de itens (sabores, etc.) não está disponível aqui.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                {editableOrderData.itens.map((item, index) => (
                  <div key={`item-${index}-${item.nomeProduto}`} className="p-3 border rounded-md bg-muted/30 relative">
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 text-destructive hover:text-destructive/90"
                        onClick={() => handleRemoveItem(index)}
                        title="Remover Item"
                        disabled={isSavingDetails}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <p className="font-semibold">{item.quantidade}x {item.nomeProduto}</p>
                    <p className="text-xs text-muted-foreground">
                      Unitário: R$ {item.precoUnitario.toFixed(2).replace('.', ',')} | Total Item: R$ {item.precoTotalItem.toFixed(2).replace('.', ',')}
                    </p>
                    {item.sabores && <p className="text-xs text-muted-foreground">Sabores: {item.sabores}</p>}
                    {item.borda && <p className="text-xs text-muted-foreground">Borda: {item.borda}</p>}
                    {item.adicionais && item.adicionais.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs font-medium">Adicionais Cobertura:</p>
                        <ul className="list-disc list-inside pl-2 text-xs text-muted-foreground">
                          {item.adicionais.map((ad, adIndex) => <li key={adIndex}>{ad.quantidade}x {ad.nome} (+R$ {ad.preco.toFixed(2).replace('.', ',')})</li>)}
                        </ul>
                      </div>
                    )}
                    {item.opcionais && item.opcionais.length > 0 && (
                       <div className="mt-1">
                        <p className="text-xs font-medium">Opcionais do Produto:</p>
                        <ul className="list-disc list-inside pl-2 text-xs text-muted-foreground">
                          {item.opcionais.map((op, opIndex) => <li key={`${op.grupo_id}-${op.item_id}-${opIndex}`}>{op.grupo_nome}: {op.item_nome} {op.item_preco_adicional > 0 ? `(+R$ ${(op.item_preco_adicional * op.quantidade).toFixed(2).replace('.', ',')})` : ''}</li>)}
                        </ul>
                       </div>
                    )}
                    {item.observacoesItem && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-start">
                            <MessageSquareText className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-blue-500" />
                           <strong className="font-medium mr-1">Obs. Item:</strong> {item.observacoesItem}
                        </p>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="addProductSearch" className="font-medium flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto ao Pedido (Simulado)
                  </Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="addProductSearch"
                      type="text"
                      placeholder="Digite para buscar produtos (não-pizzas)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      disabled={isSavingDetails}
                    />
                  </div>
                  {filteredProducts.length > 0 && (
                    <ScrollArea className="max-h-32 border rounded-md">
                      <div className="p-1">
                        {filteredProducts.map(p => (
                          <Button
                            key={p.id}
                            variant="ghost"
                            className="w-full justify-start text-sm h-auto py-1.5 px-2"
                            onClick={() => handleAddProduct(p)}
                            disabled={isSavingDetails}
                          >
                            {p.nome} <span className="ml-auto text-xs text-muted-foreground">R$ {p.preco_base.toFixed(2).replace('.',',')}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </section>
            <Separator/>

            <section>
              <h3 className="text-lg font-semibold mb-2 text-primary">Financeiro</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span> <span>R$ {editableOrderData.subtotal.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Taxa de Entrega:</span> <span>R$ {editableOrderData.taxaEntrega.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between font-bold text-md"><span>TOTAL:</span> <span>R$ {editableOrderData.total.toFixed(2).replace('.', ',')}</span></div>
                <div className="flex justify-between"><span>Forma de Pagamento:</span> <span>{editableOrderData.formaPagamento}</span></div>
              </div>
                {isEditing && (
                   <p className="text-xs text-muted-foreground mt-2">
                    Lembre-se: A edição de itens acima não atualiza estes totais automaticamente.
                   </p>
                )}
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t gap-2 flex-wrap justify-center sm:justify-end">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleToggleEdit} className="w-full sm:w-auto" disabled={isUpdatingStatus || isSavingDetails}>
                <Undo className="mr-2 h-4 w-4" /> Cancelar Edição
              </Button>
              <Button variant="default" onClick={handleSaveChanges} className="w-full sm:w-auto" disabled={isUpdatingStatus || isSavingDetails}>
                {isSavingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSavingDetails ? "Salvando..." : "Salvar Detalhes"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleToggleEdit} className="w-full sm:w-auto" disabled={isUpdatingStatus || isSavingDetails}>
              <Edit className="mr-2 h-4 w-4" /> Editar Pedido
            </Button>
          )}
           <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto" disabled={isUpdatingStatus || isSavingDetails}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Pedido
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled={isUpdatingStatus || isSavingDetails}>
              <X className="mr-2 h-4 w-4" /> Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
