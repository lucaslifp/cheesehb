
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListChecks, Pizza, DollarSign, Clock, ShoppingCart, CalendarDays, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { OrderAdmin } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState<number>(0);
  const [ordersTodayCount, setOrdersTodayCount] = useState<number>(0);
  const [revenueToday, setRevenueToday] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const fromDateStr = format(monthStart, 'yyyy-MM-dd');
        const toDateStr = format(monthEnd, 'yyyy-MM-dd');

        const faturamentoResponse = await fetch(`/api/admin/pedidos/faturamento?fromDate=${fromDateStr}&toDate=${toDateStr}`);
        if (!faturamentoResponse.ok) {
          let errorDetail = 'Falha ao buscar dados de faturamento.';
          const errorText = await faturamentoResponse.text();
          try {
            const errorData = JSON.parse(errorText);
            if (errorData && errorData.error) {
              errorDetail = errorData.error;
            } else {
              errorDetail = `Status: ${faturamentoResponse.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
            }
          } catch (parseError) {
            errorDetail = `Erro ao processar resposta do servidor. Status: ${faturamentoResponse.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
          throw new Error(errorDetail);
        }
        const faturamentoData: OrderAdmin[] = await faturamentoResponse.json();
        const totalRevenueMonth = faturamentoData.reduce((sum, order) => sum + order.total, 0);
        setCurrentMonthRevenue(totalRevenueMonth);

        const contagemStatusResponse = await fetch('/api/admin/pedidos/contagem-status');
        if (!contagemStatusResponse.ok) {
          let errorDetail = 'Falha ao buscar contagem de status de pedidos.';
          const errorText = await contagemStatusResponse.text();
          try {
            const errorData = JSON.parse(errorText);
            if (errorData && errorData.error) {
              errorDetail = errorData.error;
            } else {
              errorDetail = `Status: ${contagemStatusResponse.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
            }
          } catch (parseError) {
            errorDetail = `Erro ao processar resposta do servidor. Status: ${contagemStatusResponse.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
          console.error('Falha ao buscar contagem de status de pedidos. Response Status:', contagemStatusResponse.status, 'Error Details:', errorDetail);
          throw new Error(errorDetail);
        }
        const contagemStatusData: { status_pedido: string, count: number }[] = await contagemStatusResponse.json();
        const pendentes = contagemStatusData
          .filter(s => s.status_pedido === 'Novo' || s.status_pedido === 'Em Preparo')
          .reduce((sum, s) => sum + s.count, 0);
        setPendingOrdersCount(pendentes);

        const contagemProdutosResponse = await fetch('/api/admin/product_count_stats');
        if (!contagemProdutosResponse.ok) {
           let errorDetail = 'Falha ao buscar contagem de produtos.';
           const errorText = await contagemProdutosResponse.text();
           try {
             const errorData = JSON.parse(errorText);
             if (errorData && errorData.error) {
               errorDetail = errorData.error;
             } else {
               errorDetail = `Status: ${contagemProdutosResponse.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
             }
           } catch (parseError) {
             errorDetail = `Erro ao processar resposta do servidor. Status: ${contagemProdutosResponse.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
           }
           throw new Error(errorDetail);
        }
        const contagemProdutosData: { count: number } = await contagemProdutosResponse.json();
        setTotalProductsCount(contagemProdutosData.count);

      } catch (error: any) {
        console.error("Erro ao carregar dados do dashboard:", error);
        toast({
          title: "Erro ao Carregar Dashboard",
          description: error.message || "Não foi possível buscar os dados para o dashboard.",
          variant: "destructive",
        });
        setCurrentMonthRevenue(0);
        setPendingOrdersCount(0);
        setTotalProductsCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline font-bold">Dashboard Administrador</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Painel CheesePizza!</CardTitle>
          <CardDescription>Gerencie sua loja, produtos, pedidos e muito mais. Para análises detalhadas de faturamento, acesse a seção "Faturamento".</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{ordersTodayCount}</div>}
                    <p className="text-xs text-muted-foreground">
                    (Integração futura)
                    </p>
                </CardContent>
            </Card>
             <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">R$ {revenueToday.toFixed(2).replace('.',',')}</div>}
                     <p className="text-xs text-muted-foreground">
                    (Integração futura)
                    </p>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Faturamento Mês Atual</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">R$ {currentMonthRevenue.toFixed(2).replace('.',',')}</div>}
                     <p className="text-xs text-muted-foreground">
                        Referente a {format(new Date(), "MMMM yyyy", { locale: ptBR })}
                    </p>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{pendingOrdersCount}</div>}
                     <p className="text-xs text-muted-foreground">
                    Aguardando preparo ou entrega
                    </p>
                </CardContent>
            </Card>
            <Card className="shadow-sm md:col-span-2 lg:col-span-2 xl:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                    <Pizza className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalProductsCount}</div>}
                    <p className="text-xs text-muted-foreground">
                    Produtos ativos e cadastrados
                    </p>
                    <Link href="/admin/produtos" passHref>
                         <Button variant="outline" size="sm" className="mt-2">Ver Produtos</Button>
                    </Link>
                </CardContent>
            </Card>
        </CardContent>
        <CardFooter className="pt-6">
            <Link href="/admin/pedidos" passHref>
                <Button variant="default" size="lg">
                    <ShoppingCart className="mr-2 h-5 w-5" /> Ver Todos os Pedidos
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
