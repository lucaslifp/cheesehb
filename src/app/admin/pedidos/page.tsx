
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderDetailPanel } from '@/components/admin/pedidos/OrderDetailPanel';
import type { OrderAdmin, OrderStatusAdmin, PedidoDB } from '@/types';
import { orderStatusAdmin as ALL_STATUSES } from '@/types';
import { getStatusBadgeVariant, formatTimeDifference } from '@/lib/admin-utils';
import Link from 'next/link';
import {
  ListFilter,
  PlusCircle,
  Printer,
  RefreshCw,
  Search,
  ArrowLeft,
  ChevronDown,
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type DateFilterOption = 'today' | 'yesterday' | 'this_month' | 'all';


export default function AdminPedidosPage() {
  const [allOrders, setAllOrders] = useState<OrderAdmin[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderAdmin[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusAdmin | 'todos'>('todos');
  
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);


  const [selectedOrdersForBulk, setSelectedOrdersForBulk] = useState<Set<string>>(new Set());
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  const fetchOrders = useCallback(async (filterDate: Date | null = new Date()) => {
    setIsLoading(true);
    try {
      let url = '/api/admin/pedidos';
      if (filterDate) {
        url += `?date=${format(filterDate, 'yyyy-MM-dd')}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar pedidos');
      }
      const data: OrderAdmin[] = await response.json();
      setAllOrders(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao Carregar Pedidos',
        description: error.message,
        variant: 'destructive',
      });
      setAllOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateFilter === 'today') {
      fetchOrders(new Date());
    } else if (dateFilter === 'yesterday') {
      fetchOrders(subDays(new Date(), 1));
    } else if (dateFilter === 'this_month' || dateFilter === 'all') {
      fetchOrders(null); 
    }
  }, [fetchOrders, dateFilter]);


  useEffect(() => {
    let tempFilteredOrders = [...allOrders];

    if (statusFilter !== 'todos') {
      tempFilteredOrders = tempFilteredOrders.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempFilteredOrders = tempFilteredOrders.filter(order =>
        order.order_number.toLowerCase().includes(lowerSearchTerm) ||
        order.cliente.nome.toLowerCase().includes(lowerSearchTerm) ||
        order.cliente.telefone.includes(lowerSearchTerm) ||
        order.itens.some(item => item.nomeProduto.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    if (dateFilter === 'this_month') {
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        tempFilteredOrders = tempFilteredOrders.filter(order => {
            const orderDate = parseISO(order.timestamp); 
            return isValid(orderDate) && orderDate >= monthStart && orderDate <= monthEnd;
        });
    }

    setFilteredOrders(tempFilteredOrders);
  }, [allOrders, searchTerm, statusFilter, dateFilter]);

  const handleSelectOrderForBulk = useCallback((orderId: string, isSelected: boolean) => {
    setSelectedOrdersForBulk(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
  }, []);

  const isAllSelectedForBulk = useMemo(() => {
    return filteredOrders.length > 0 && selectedOrdersForBulk.size === filteredOrders.length;
  }, [filteredOrders, selectedOrdersForBulk]);

  const handleSelectAllForBulk = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedOrdersForBulk(new Set(filteredOrders.map(order => order.id)));
    } else {
      setSelectedOrdersForBulk(new Set());
    }
  }, [filteredOrders]);

  const handlePrintSelected = () => {
    if (selectedOrdersForBulk.size === 0) {
      toast({ title: "Nenhum Pedido Selecionado", description: "Selecione um ou mais pedidos para imprimir.", variant: "default" });
      return;
    }
    toast({
      title: "Impressão Solicitada (Simulação)",
      description: `${selectedOrdersForBulk.size} pedido(s) seriam enviados para impressão.`,
    });
  };

  const handleChangeStatus = async (newStatus: OrderStatusAdmin) => {
    if (selectedOrdersForBulk.size === 0) {
      toast({ title: "Nenhum Pedido Selecionado", description: "Selecione pedidos para alterar o status.", variant: "default" });
      return;
    }
    setIsBulkActionLoading(true);
    try {
      const promises = Array.from(selectedOrdersForBulk).map(orderId =>
        fetch(`/api/admin/pedidos/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }).then(res => res.json())
      );
      await Promise.all(promises);
      toast({ title: "Status Alterado!", description: `${selectedOrdersForBulk.size} pedido(s) atualizado(s) para ${newStatus}.` });
      setSelectedOrdersForBulk(new Set()); // Limpar seleção
      await fetchOrders(dateFilter === 'today' ? new Date() : (dateFilter === 'yesterday' ? subDays(new Date(), 1) : null)); // Refrescar lista
    } catch (error: any) {
      toast({ title: "Erro ao Alterar Status", description: error.message, variant: "destructive" });
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleUpdateOrderFromPanel = (updatedOrder: OrderAdmin) => {
    setAllOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    if (selectedOrder?.id === updatedOrder.id) {
      setSelectedOrder(updatedOrder);
    }
  };
  
  const handleSetDateFilter = (option: DateFilterOption) => {
    setDateFilter(option);
    setSelectedOrder(null);
    setIsDatePopoverOpen(false);
  };

  const dateFilterLabel = useMemo(() => {
    switch (dateFilter) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Ontem';
      case 'this_month': return 'Este Mês';
      case 'all': return 'Todos';
      default: return 'Selecionar Data';
    }
  }, [dateFilter]);

  return (
    <div className="flex flex-col lg:flex-row gap-0 md:gap-4 min-h-[calc(100vh-var(--admin-header-height,4rem)-2rem)]"> {/* Ajustar altura */}
      {/* Coluna da Lista de Pedidos */}
      <Card className="w-full lg:w-3/5 xl:w-2/3 flex-shrink-0 shadow-md rounded-lg flex flex-col">
        <CardHeader className="px-4 py-3 border-b">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <CardTitle className="text-xl sm:text-2xl font-headline">Gerenciar Pedidos</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchOrders(dateFilter === 'today' ? new Date() : (dateFilter === 'yesterday' ? subDays(new Date(), 1) : null))} disabled={isLoading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} /> Atualizar
              </Button>
              <Link href="/admin/pedidos/novo" passHref>
                <Button variant="default" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Registrar Pedido Manual
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nº, cliente, tel..."
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <ListFilter className="mr-2 h-4 w-4" /> Status: {statusFilter === 'todos' ? 'Todos' : statusFilter} <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={(val) => setStatusFilter(val as OrderStatusAdmin | 'todos')}>
                  <DropdownMenuRadioItem value="todos">Todos Status</DropdownMenuRadioItem>
                  {ALL_STATUSES.map(s => (
                    <DropdownMenuRadioItem key={s} value={s}>{s}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
             <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                        <ListFilter className="mr-2 h-4 w-4" /> {dateFilterLabel} <ChevronDown className="ml-2 h-4 w-4"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2 space-y-1">
                        <Button variant={dateFilter === 'today' ? "secondary" : "ghost"} size="sm" className="w-full justify-start" onClick={() => handleSetDateFilter('today')}>Hoje</Button>
                        <Button variant={dateFilter === 'yesterday' ? "secondary" : "ghost"} size="sm" className="w-full justify-start" onClick={() => handleSetDateFilter('yesterday')}>Ontem</Button>
                        <Button variant={dateFilter === 'this_month' ? "secondary" : "ghost"} size="sm" className="w-full justify-start" onClick={() => handleSetDateFilter('this_month')}>Este Mês</Button>
                        <Button variant={dateFilter === 'all' ? "secondary" : "ghost"} size="sm" className="w-full justify-start" onClick={() => handleSetDateFilter('all')}>Todos</Button>
                    </div>
                </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-grow overflow-hidden">
          <ScrollArea className="h-[calc(100vh-var(--admin-header-height,4rem)-var(--admin-card-header-height,10rem)-var(--admin-card-footer-height,3rem)-2rem)]"> {/* Ajuste de altura */}
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg">Carregando pedidos...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] px-2 sm:px-3">
                      <Checkbox
                        checked={isAllSelectedForBulk}
                        onCheckedChange={handleSelectAllForBulk}
                        aria-label="Selecionar todos os pedidos visíveis"
                      />
                    </TableHead>
                    <TableHead className="w-[100px] px-2 sm:px-3">Pedido</TableHead>
                    <TableHead className="px-2 sm:px-3">Cliente</TableHead>
                    <TableHead className="text-center px-1 sm:px-3 w-[120px] sm:w-[150px]">Status</TableHead>
                    <TableHead className="text-right px-2 sm:px-3">Total</TableHead>
                    <TableHead className="text-right px-2 sm:px-3">Há</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const { variant: badgeVariant, className: badgeClassName } = getStatusBadgeVariant(order.status);
                    const timeDiff = formatTimeDifference(order.timestamp);
                    return (
                      <TableRow
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={cn(
                          "cursor-pointer hover:bg-muted/60",
                          selectedOrder?.id === order.id && "bg-primary/10 hover:bg-primary/20"
                        )}
                        data-state={selectedOrder?.id === order.id ? "selected" : ""}
                      >
                        <TableCell className="px-2 sm:px-3">
                          <Checkbox
                            checked={selectedOrdersForBulk.has(order.id)}
                            onCheckedChange={(checked) => handleSelectOrderForBulk(order.id, !!checked)}
                            onClick={(e) => e.stopPropagation()} // Evitar que o clique na checkbox selecione a linha
                            aria-label={`Selecionar pedido ${order.order_number}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium px-2 sm:px-3">{order.order_number}</TableCell>
                        <TableCell className="px-2 sm:px-3">{order.cliente.nome}</TableCell>
                        <TableCell className="text-center px-1 sm:px-3">
                          <Badge variant={badgeVariant} className={cn(badgeClassName, "text-xs px-1.5 py-0.5 sm:px-2")}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-2 sm:px-3">R$ {order.total.toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell className={cn("text-right text-xs px-2 sm:px-3", timeDiff.isOverdue && "text-destructive font-semibold")}>
                           {timeDiff.text}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                 <FileText className="mx-auto h-10 w-10 mb-3 text-gray-400" />
                <p className="font-semibold">Nenhum pedido encontrado.</p>
                <p className="text-sm">Tente ajustar os filtros ou verifique mais tarde.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="px-4 py-2 border-t flex flex-wrap items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
            {selectedOrdersForBulk.size > 0 
              ? `${selectedOrdersForBulk.size} pedido(s) selecionado(s)` 
              : `${filteredOrders.length} pedido(s) ${statusFilter !== 'todos' ? `com status "${statusFilter}"` : 'no período'}.`
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="xs" onClick={handlePrintSelected} disabled={selectedOrdersForBulk.size === 0 || isBulkActionLoading}>
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Imprimir Selecionados
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="xs" disabled={selectedOrdersForBulk.size === 0 || isBulkActionLoading}>
                    {isBulkActionLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Alterar Status <ChevronDown className="ml-1.5 h-3.5 w-3.5"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Novo Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_STATUSES.map(s => (
                    <DropdownMenuItem key={s} onClick={() => handleChangeStatus(s)} className="text-xs">
                        <Badge variant={getStatusBadgeVariant(s).variant} className={cn(getStatusBadgeVariant(s).className, "mr-2")}>{s}</Badge>
                    </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>

      {/* Coluna do Painel de Detalhes */}
      <div className="w-full lg:w-2/5 xl:w-1/3 lg:sticky lg:top-[calc(var(--admin-header-height,4rem)+1rem)] lg:max-h-[calc(100vh-var(--admin-header-height,4rem)-2rem)] flex-shrink-0 mt-6 lg:mt-0">
        <OrderDetailPanel order={selectedOrder} onUpdateOrder={handleUpdateOrderFromPanel} />
      </div>
    </div>
  );
}

