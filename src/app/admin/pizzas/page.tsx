"use client";

import { useEffect, useState, useMemo } from "react";
import type { Database } from "@/types/supabase"; // Using Supabase generated types
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Loader2,
  Pizza as PizzaIcon,
  PlusCircle,
  CircleDot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Directly use the Supabase generated type for a row in the 'produtos' table
type ProdutoRow = Database["public"]["Tables"]["produtos"]["Row"];

export default function PizzaMeioAMeioPage() {
  const [pizzas, setPizzas] = useState<ProdutoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroTamanho, setFiltroTamanho] = useState<string>("todos");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pizzaToDelete, setPizzaToDelete] = useState<ProdutoRow | null>(null);

  const fetchPizzas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/produtos?personalizable=true");
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          "Erro ao carregar Pizzas Meio a Meio (produtos personalizáveis):",
          errorText
        );
        setPizzas([]);
        toast({
          title: "Erro ao Carregar Pizzas Meio a Meio",
          description: `Falha ao buscar dados: ${res.status}. Verifique o console para detalhes.`,
          variant: "destructive",
        });
        return;
      }
      const data: ProdutoRow[] = await res.json();
      setPizzas(data.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error: any) {
      console.error(
        "Erro ao carregar Pizzas Meio a Meio (produtos personalizáveis):",
        error
      );
      setPizzas([]);
      toast({
        title: "Erro ao Carregar Pizzas Meio a Meio",
        description:
          error.message ||
          "Não foi possível buscar os dados das Pizzas Meio a Meio.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPizzas();
  }, []);

  const handleOpenDeleteDialog = (pizza: ProdutoRow) => {
    setPizzaToDelete(pizza);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pizzaToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/produtos/${pizzaToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        let errorDetail = "Falha ao excluir a Pizza Meio a Meio.";
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) errorDetail = errorData.error;
        } catch (e) {
          /* raw text */
        }
        throw new Error(errorDetail);
      }
      toast({
        title: "Pizza Meio a Meio Excluída!",
        description: `A pizza \"${pizzaToDelete.nome}\" foi excluída.`,
      });
      setPizzas((prev) => prev.filter((p) => p.id !== pizzaToDelete.id));
    } catch (error: any) {
      toast({
        title: "Erro ao Excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setPizzaToDelete(null);
    }
  };

  const pizzasFiltradas = useMemo(() => {
    return pizzas.filter((pizza) => {
      const nomeMatch = pizza.nome.toLowerCase().includes(busca.toLowerCase());
      const tamanhoMatch =
        filtroTamanho === "todos" ||
        (pizza.available_sizes &&
          pizza.available_sizes[0]?.toLowerCase() ===
            filtroTamanho.toLowerCase());
      return nomeMatch && tamanhoMatch;
    });
  }, [pizzas, busca, filtroTamanho]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg">Carregando Pizzas Meio a Meio...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-headline font-bold">Pizza Meio a Meio</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/sabores-pizza">
            <Button variant="outline">
              <PizzaIcon className="mr-2 h-4 w-4" /> Gerenciar Sabores
            </Button>
          </Link>
          <Link href="/admin/bordas-pizza">
            <Button variant="outline">
              <CircleDot className="mr-2 h-4 w-4" /> Gerenciar Bordas
            </Button>
          </Link>
          <Link href="/admin/pizzas/nova">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Cadastro de Pizza Meio a
              Meio
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Input
          placeholder="Buscar pizza por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs h-9"
        />
        <Select onValueChange={setFiltroTamanho} value={filtroTamanho}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tamanhos</SelectItem>
            <SelectItem value="pequena">Pequena</SelectItem>
            <SelectItem value="grande">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pizzas Meio a Meio Cadastradas</CardTitle>
          <CardDescription>
            Gerencie as opções de massa e tamanho que os clientes usarão para
            montar suas pizzas personalizadas. O preço final da pizza será
            calculado com base nos sabores e bordas escolhidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pizzasFiltradas.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagem</TableHead>
                    <TableHead>Nome da Pizza</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">No Cardápio</TableHead>
                    <TableHead className="text-center">Tamanho Base</TableHead>
                    <TableHead className="text-right w-[120px]">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pizzasFiltradas.map((pizza) => (
                    <TableRow key={pizza.id}>
                      <TableCell>
                        <Image
                          src={
                            pizza.imagem_url ||
                            "https://placehold.co/50x50.png?text=Pizza"
                          }
                          alt={pizza.nome}
                          width={50}
                          height={50}
                          className="rounded aspect-square object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/50x50.png?text=Erro";
                          }}
                          data-ai-hint="pizza base"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {pizza.nome}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={pizza.ativo ? "default" : "outline"}>
                          {pizza.ativo ? (
                            <Eye className="mr-1 h-3 w-3" />
                          ) : (
                            <EyeOff className="mr-1 h-3 w-3" />
                          )}
                          {pizza.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            pizza.mostrar_no_cardapio ? "default" : "outline"
                          }
                        >
                          {pizza.mostrar_no_cardapio ? (
                            <Eye className="mr-1 h-3 w-3" />
                          ) : (
                            <EyeOff className="mr-1 h-3 w-3" />
                          )}
                          {pizza.mostrar_no_cardapio ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge>
                          {pizza.available_sizes && pizza.available_sizes[0]
                            ? pizza.available_sizes[0].charAt(0).toUpperCase() +
                              pizza.available_sizes[0].slice(1)
                            : "N/D"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Link href={`/admin/pizzas/${pizza.id}/editar`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar Pizza Meio a Meio"
                            disabled={isSubmitting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => handleOpenDeleteDialog(pizza)}
                          disabled={isSubmitting}
                          title="Excluir Pizza Meio a Meio"
                        >
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
              {busca || filtroTamanho !== "todos"
                ? "Nenhuma Pizza Meio a Meio encontrada com os filtros aplicados."
                : "Nenhuma Pizza Meio a Meio cadastrada. Adicione uma para começar."}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 border-t pt-6 flex justify-end">
          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Delete dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a Pizza Meio a Meio "
              {pizzaToDelete?.nome}"? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setPizzaToDelete(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
