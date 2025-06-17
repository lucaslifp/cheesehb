
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CalendarDays, DollarSign, ArrowLeft, ShoppingCart, BarChart3 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isWithinInterval, parse, isValid, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { OrderAdmin } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// Dados de pedidos removidos. A página buscará dados reais quando a API de pedidos for implementada.
const sampleOrdersAdmin: OrderAdmin[] = [];

const parseOrderTimestamp = (timestamp: string): Date | null => {
  try {
    const parsedDate = parse(timestamp, 'dd/MM/yyyy, HH:mm:ss', new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
    return null;
  } catch (error) {
    console.error("Erro ao parsear timestamp:", timestamp, error);
    return null;
  }
};

export default function FaturamentoPage() {
  const [fromDate, setFromDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [isFromPopoverOpen, setIsFromPopoverOpen] = useState(false);
  const [isToPopoverOpen, setIsToPopoverOpen] = useState(false);

  const [periodRevenue, setPeriodRevenue] = useState<number>(0);
  const [numberOfOrdersInPeriod, setNumberOfOrdersInPeriod] = useState<number>(0);
  const [averageTicket, setAverageTicket] = useState<number>(0);
  const [filteredOrders, setFilteredOrders] = useState<OrderAdmin[]>([]);

  useEffect(() => {
    // Esta lógica dependerá da busca de pedidos reais da API quando implementada.
    // Por agora, com sampleOrdersAdmin vazio, os valores serão zero.
    if (fromDate) {
      const startDate = startOfDay(fromDate);
      const endDate = toDate && fromDate <= toDate ? endOfDay(toDate) : endOfDay(fromDate);

      let revenue = 0;
      const ordersInPeriod: OrderAdmin[] = [];

      sampleOrdersAdmin.forEach(order => {
        const orderDate = parseOrderTimestamp(order.timestamp);
        if (orderDate && isWithinInterval(orderDate, { start: startDate, end: endDate })) {
          if (order.status === 'Entregue') { 
            revenue += order.total;
            ordersInPeriod.push(order);
          }
        }
      });
      setPeriodRevenue(revenue);
      setFilteredOrders(ordersInPeriod.sort((a,b) => parseOrderTimestamp(b.timestamp)!.getTime() - parseOrderTimestamp(a.timestamp)!.getTime()));
      setNumberOfOrdersInPeriod(ordersInPeriod.length);
      setAverageTicket(ordersInPeriod.length > 0 ? revenue / ordersInPeriod.length : 0);
    } else {
      setPeriodRevenue(0);
      setFilteredOrders([]);
      setNumberOfOrdersInPeriod(0);
      setAverageTicket(0);
    }
  }, [fromDate, toDate]);

  const handleExport = () => {
    toast({
      title: "Exportação de Relatório",
      description: "A funcionalidade de exportar para Excel está em desenvolvimento e será disponibilizada em breve.",
      duration: 5000,
    });
  };
  
  const formatPeriodTitle = (start?: Date, end?: Date): string => {
     if (!start) {
      return "Selecione um período.";
    }
    const fromDateStr = format(start, "P", { locale: ptBR });
    if (end && start <= end) {
      const toDateStr = format(end, "P", { locale: ptBR });
      if (format(start, "dd/MM/yyyy") === format(end, "dd/MM/yyyy")) { // Single day selected
          return `Dados de ${fromDateStr} (pedidos entregues).`;
      }
      return `Dados de ${fromDateStr} até ${toDateStr} (pedidos entregues).`;
    }
    return `Dados de ${fromDateStr} (pedidos entregues).`;
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline font-bold">Relatório de Faturamento</h1>
        <div className="flex flex-col sm:flex-row gap-x-4 gap-y-2 items-stretch sm:items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="fromDate" className="text-sm font-medium shrink-0">De:</Label>
            <Popover open={isFromPopoverOpen} onOpenChange={setIsFromPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="fromDate"
                  variant={"outline"}
                  className={cn(
                    "w-[160px] justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Data inicial</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(date) => {
                    setFromDate(date);
                    setIsFromPopoverOpen(false);
                  }}
                  defaultMonth={fromDate || startOfMonth(new Date())}
                  initialFocus
                  locale={ptBR}
                  disabled={(date) => (toDate && date > toDate) || date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toDate" className="text-sm font-medium shrink-0">Até:</Label>
            <Popover open={isToPopoverOpen} onOpenChange={setIsToPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="toDate"
                  variant={"outline"}
                  className={cn(
                    "w-[160px] justify-start text-left font-normal",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Data final</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(date) => {
                    setToDate(date);
                    setIsToPopoverOpen(false);
                  }}
                  defaultMonth={toDate || fromDate || startOfMonth(new Date())}
                  initialFocus
                  locale={ptBR}
                  disabled={(date) => (fromDate && date < fromDate) || date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto shrink-0">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório (Excel)
          </Button>
        </div>
      </div>

      <Card className="mb-8 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium flex items-center">
             Resumo do Período
          </CardTitle>
           <CardDescription>
            {formatPeriodTitle(fromDate, toDate)} (Esta seção aguarda a integração da API de Pedidos para dados reais.)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="flex flex-col items-center p-4 border rounded-lg bg-muted/30">
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold text-primary">R$ {periodRevenue.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg bg-muted/30">
                <ShoppingCart className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Nº de Pedidos</p>
                <p className="text-2xl font-bold text-primary">{numberOfOrdersInPeriod}</p>
            </div>
             <div className="flex flex-col items-center p-4 border rounded-lg bg-muted/30">
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold text-primary">R$ {averageTicket.toFixed(2).replace('.', ',')}</p>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Detalhes dos Pedidos do Período</CardTitle>
          <CardDescription>
            Lista de pedidos com status "Entregue" no período selecionado. (Aguardando integração da API de Pedidos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[50vh]">
            {filteredOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Pedido</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Forma Pagamento</TableHead>
                    <TableHead className="text-right">Total (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.timestamp}</TableCell>
                      <TableCell>{order.cliente.nome}</TableCell>
                      <TableCell>{order.formaPagamento}</TableCell>
                      <TableCell className="text-right font-semibold">{order.total.toFixed(2).replace('.', ',')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pedido entregue encontrado para o período selecionado.
              </p>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="mt-6 border-t pt-6">
           <Link href="/admin">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
