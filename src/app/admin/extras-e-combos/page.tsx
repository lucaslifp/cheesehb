"use client";

import React, { useState, useEffect, type FormEvent, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PlusCircle,
  ArrowLeft,
  PackageSearch,
  ListChecks,
  GripVertical,
  CircleHelp,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { GrupoOpcional, ItemOpcional, TipoSelecaoGrupo } from "@/types";
import { tiposSelecaoGrupoDisplay } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ✅ NOVOS UTILITÁRIOS
import { IconButton } from "@/components/admin/IconButton";
import { BadgeSimNao } from "@/components/admin/BadgeSimNao";

export default function AdminExtrasCombosPage() {
  const [gruposOpcionais, setGruposOpcionais] = useState<GrupoOpcional[]>([]);
  const [searchTermGrupo, setSearchTermGrupo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isGrupoFormDialogOpen, setIsGrupoFormDialogOpen] = useState(false);
  const [currentGrupo, setCurrentGrupo] =
    useState<Partial<GrupoOpcional> | null>(null);
  const [nomeGrupoForm, setNomeGrupoForm] = useState("");
  const [tipoSelecaoForm, setTipoSelecaoForm] = useState<
    TipoSelecaoGrupo | undefined
  >(undefined);
  const [instrucaoForm, setInstrucaoForm] = useState("");
  const [minSelecoesForm, setMinSelecoesForm] = useState<number | undefined>(
    undefined
  );
  const [maxSelecoesForm, setMaxSelecoesForm] = useState<number | undefined>(
    undefined
  );
  const [itensDoGrupoForm, setItensDoGrupoForm] = useState<ItemOpcional[]>([]);

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);
  const [currentItemOpcional, setCurrentItemOpcional] =
    useState<Partial<ItemOpcional> | null>(null);
  const [nomeItemForm, setNomeItemForm] = useState("");
  const [precoAdicionalItemForm, setPrecoAdicionalItemForm] =
    useState<number>(0);
  const [isDefaultItemForm, setIsDefaultItemForm] = useState<boolean>(false);

  const [isGrupoDeleteDialogOpen, setIsGrupoDeleteDialogOpen] = useState(false);
  const [grupoToDelete, setGrupoToDelete] = useState<GrupoOpcional | null>(
    null
  );

  const [isItemDeleteDialogOpen, setIsItemDeleteDialogOpen] = useState(false);
  const [itemOpcionalToDelete, setItemOpcionalToDelete] =
    useState<ItemOpcional | null>(null);

  const fetchGruposOpcionais = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/grupos-opcionais");
      if (!response.ok) {
        let errorDetail = "Falha ao buscar grupos opcionais.";
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            errorDetail = errorData.error;
          } else {
            errorDetail = `Status: ${
              response.status
            }. Resposta: ${errorText.substring(0, 200)}${
              errorText.length > 200 ? "..." : ""
            }`;
          }
        } catch {
          errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}.`;
        }
        throw new Error(errorDetail);
      }
      const data: GrupoOpcional[] = await response.json();
      setGruposOpcionais(
        data.sort(
          (a, b) =>
            (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome)
        )
      );
    } catch (error: any) {
      toast({
        title: "Erro ao Carregar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGruposOpcionais();
  }, []);

  const resetGrupoFormFields = () => {
    setNomeGrupoForm("");
    setTipoSelecaoForm(undefined);
    setInstrucaoForm("");
    setMinSelecoesForm(undefined);
    setMaxSelecoesForm(undefined);
    setItensDoGrupoForm([]);
    setCurrentGrupo(null);
  };

  const resetItemFormFields = () => {
    setNomeItemForm("");
    setPrecoAdicionalItemForm(0);
    setIsDefaultItemForm(false);
    setCurrentItemOpcional(null);
  };

  const handleOpenAddGrupoDialog = () => {
    resetGrupoFormFields();
    setIsGrupoFormDialogOpen(true);
  };

  const handleOpenEditGrupoDialog = (grupo: GrupoOpcional) => {
    setCurrentGrupo(grupo);
    setNomeGrupoForm(grupo.nome);
    setTipoSelecaoForm(grupo.tipo_selecao);
    setInstrucaoForm(grupo.instrucao || "");
    setMinSelecoesForm(
      grupo.min_selecoes === null ? undefined : grupo.min_selecoes
    );
    setMaxSelecoesForm(
      grupo.max_selecoes === null ? undefined : grupo.max_selecoes
    );
    setItensDoGrupoForm([...(grupo.itens || [])]);
    setIsGrupoFormDialogOpen(true);
  };

  const handleGrupoFormSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nomeGrupoForm.trim()) {
      toast({
        title: "Erro",
        description: "O nome do grupo não pode ser vazio.",
        variant: "destructive",
      });
      return;
    }
    if (!tipoSelecaoForm) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de seleção para o grupo.",
        variant: "destructive",
      });
      return;
    }
    if (itensDoGrupoForm.length === 0) {
      toast({
        title: "Erro",
        description: "O grupo deve ter pelo menos um item opcional.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const grupoPayload = {
      nome: nomeGrupoForm,
      tipo_selecao: tipoSelecaoForm,
      instrucao: instrucaoForm || undefined,
      min_selecoes:
        tipoSelecaoForm === "CHECKBOX_OBRIGATORIO_MULTI" &&
        minSelecoesForm !== undefined
          ? minSelecoesForm
          : null,
      max_selecoes:
        tipoSelecaoForm.startsWith("CHECKBOX") && maxSelecoesForm !== undefined
          ? maxSelecoesForm
          : null,
      ativo: currentGrupo?.ativo ?? true,
      ordem: currentGrupo?.ordem ?? 0,
      itens: itensDoGrupoForm.map((item) => ({
        id: item.id,
        nome: item.nome,
        preco_adicional: item.preco_adicional,
        produto_original_id: item.produto_original_id || null,
        default_selecionado: item.default_selecionado || false,
        ordem: item.ordem || 0,
        ativo: item.ativo ?? true,
      })),
    };

    try {
      let response: Response;
      if (currentGrupo && currentGrupo.id) {
        response = await fetch(
          `/api/admin/grupos-opcionais/${currentGrupo.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(grupoPayload),
          }
        );
      } else {
        response = await fetch("/api/admin/grupos-opcionais", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(grupoPayload),
        });
      }

      if (!response.ok) {
        let errorDetail = `Falha ao ${
          currentGrupo?.id ? "atualizar" : "adicionar"
        } grupo.`;
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            errorDetail = errorData.error;
          } else {
            errorDetail = `Status: ${
              response.status
            }. Resposta: ${errorText.substring(0, 200)}${
              errorText.length > 200 ? "..." : ""
            }`;
          }
        } catch {
          errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}.`;
        }
        throw new Error(errorDetail);
      }

      await fetchGruposOpcionais();
      toast({
        title: `Grupo ${currentGrupo?.id ? "Atualizado" : "Adicionado"}!`,
        description: `O grupo "${nomeGrupoForm}" foi salvo com sucesso.`,
      });
      setIsGrupoFormDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao Salvar Grupo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteGrupoDialog = (grupo: GrupoOpcional) => {
    setGrupoToDelete(grupo);
    setIsGrupoDeleteDialogOpen(true);
  };

  const handleDeleteGrupoConfirm = async () => {
    if (!grupoToDelete || !grupoToDelete.id) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/grupos-opcionais/${grupoToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Falha ao excluir grupo.");
      }
      await fetchGruposOpcionais();
      toast({
        title: "Grupo Excluído!",
        description: `O grupo "${grupoToDelete.nome}" foi excluído.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Excluir Grupo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsGrupoDeleteDialogOpen(false);
      setGrupoToDelete(null);
    }
  };

  const handleOpenAddItemOpcionalDialog = () => {
    resetItemFormFields();
    setIsItemFormDialogOpen(true);
  };

  const handleOpenEditItemOpcionalDialog = (item: ItemOpcional) => {
    setCurrentItemOpcional(item);
    setNomeItemForm(item.nome);
    setPrecoAdicionalItemForm(item.preco_adicional);
    setIsDefaultItemForm(item.default_selecionado || false);
    setIsItemFormDialogOpen(true);
  };

  const handleItemFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!nomeItemForm.trim()) {
      toast({
        title: "Erro",
        description: "O nome do item não pode ser vazio.",
        variant: "destructive",
      });
      return;
    }
    if (precoAdicionalItemForm < 0) {
      toast({
        title: "Erro",
        description: "O preço adicional não pode ser negativo.",
        variant: "destructive",
      });
      return;
    }

    setItensDoGrupoForm((prevItens) => {
      if (currentItemOpcional && currentItemOpcional.id) {
        return prevItens.map((it) =>
          it.id === currentItemOpcional.id
            ? {
                ...it,
                nome: nomeItemForm,
                preco_adicional: precoAdicionalItemForm,
                default_selecionado: isDefaultItemForm,
              }
            : it
        );
      }

      const tempId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const novoItem: ItemOpcional = {
        id: tempId,
        nome: nomeItemForm,
        preco_adicional: precoAdicionalItemForm,
        default_selecionado: isDefaultItemForm,
        ativo: true,
        ordem: prevItens.length,
      };
      return [...prevItens, novoItem];
    });
    setIsItemFormDialogOpen(false);
    toast({
      title: `Item ${currentItemOpcional?.id ? "Atualizado" : "Adicionado"}!`,
      description: `Item "${nomeItemForm}" foi ${
        currentItemOpcional?.id ? "atualizado" : "adicionado"
      } ao grupo.`,
    });
  };

  const handleOpenDeleteItemOpcionalDialog = (item: ItemOpcional) => {
    setItemOpcionalToDelete(item);
    setIsItemDeleteDialogOpen(true);
  };

  const handleDeleteItemOpcionalConfirm = () => {
    if (itemOpcionalToDelete) {
      setItensDoGrupoForm((prevItens) =>
        prevItens.filter((it) => it.id !== itemOpcionalToDelete.id)
      );
      toast({
        title: "Item Removido!",
        description: `O item "${itemOpcionalToDelete.nome}" foi removido do grupo.`,
        variant: "destructive",
      });
    }
    setIsItemDeleteDialogOpen(false);
    setItemOpcionalToDelete(null);
  };

  const filteredGrupos = useMemo(() => {
    return gruposOpcionais
      .filter((grupo) =>
        grupo.nome.toLowerCase().includes(searchTermGrupo.toLowerCase())
      )
      .sort(
        (a, b) =>
          (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome)
      );
  }, [gruposOpcionais, searchTermGrupo]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center">
          <PackageSearch className="mr-3 h-8 w-8" />
          Extras &amp; Combos (Grupos)
        </h1>
        <Button onClick={handleOpenAddGrupoDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Grupo de Opcionais
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grupos de Opcionais Estruturados</CardTitle>
          <CardDescription>
            Crie e gerencie grupos de itens opcionais que podem ser adicionados
            a produtos. Defina nome, tipo de seleção, regras e os itens dentro
            de cada grupo. A associação a produtos será feita na tela de
            cadastro/edição de produtos.
          </CardDescription>
          <div className="mt-4 relative">
            <ListChecks className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupo por nome..."
              className="pl-8 w-full md:w-1/3"
              value={searchTermGrupo}
              onChange={(e) => setSearchTermGrupo(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando grupos...</p>
            </div>
          ) : filteredGrupos.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Grupo</TableHead>
                    <TableHead>Tipo de Seleção</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-center">Min/Max</TableHead>
                    <TableHead className="text-center w-[120px]">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrupos.map((grupo) => (
                    <TableRow
                      key={grupo.id}
                      className="border-b hover:bg-muted/40"
                    >
                      <TableCell className="font-medium">
                        {grupo.nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tiposSelecaoGrupoDisplay[grupo.tipo_selecao]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <BadgeSimNao value={!!grupo.ativo} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{grupo.itens.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {grupo.tipo_selecao.startsWith("CHECKBOX") &&
                          `${grupo.min_selecoes ?? "-"}/${
                            grupo.max_selecoes ?? "-"
                          }`}
                        {grupo.tipo_selecao === "RADIO_OBRIGATORIO" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CircleHelp className="h-3 w-3 text-muted-foreground inline-block ml-1 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Para seleção única, mínimo é 1 e máximo é 1.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell className="text-center space-x-1">
                        <IconButton
                          icon="pencil"
                          onClick={() => handleOpenEditGrupoDialog(grupo)}
                          disabled={isSubmitting}
                        />
                        <IconButton
                          icon="trash"
                          variant="destructive"
                          onClick={() => handleOpenDeleteGrupoDialog(grupo)}
                          disabled={isSubmitting}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {searchTermGrupo
                ? `Nenhum grupo encontrado com o termo "${searchTermGrupo}".`
                : "Nenhum grupo de opcionais cadastrado."}
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

      {/* ------------------ DIALOG GRUPO ------------------ */}
      <Dialog
        open={isGrupoFormDialogOpen}
        onOpenChange={setIsGrupoFormDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentGrupo?.id ? "Editar" : "Adicionar"} Grupo de Opcionais
            </DialogTitle>
            <DialogDescription>
              {currentGrupo?.id
                ? "Altere os dados do grupo e gerencie seus itens."
                : "Preencha os dados para o novo grupo e adicione seus itens."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGrupoFormSubmit}>
            <ScrollArea className="max-h-[70vh] p-1 pr-3">
              {/* Detalhes do Grupo */}
              <div className="grid gap-6 py-4">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Detalhes do Grupo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="nomeGrupo">Nome do Grupo</Label>
                      <Input
                        id="nomeGrupo"
                        value={nomeGrupoForm}
                        onChange={(e) => setNomeGrupoForm(e.target.value)}
                        placeholder="Ex: Escolha seu Refrigerante"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tipoSelecao">Tipo de Seleção</Label>
                      <Select
                        value={tipoSelecaoForm}
                        onValueChange={(value: TipoSelecaoGrupo) =>
                          setTipoSelecaoForm(value)
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="tipoSelecao">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(tiposSelecaoGrupoDisplay).map(
                            ([key, value]) => (
                              <SelectItem
                                key={key}
                                value={key as TipoSelecaoGrupo}
                              >
                                {value}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="instrucao">Instrução (Opcional)</Label>
                      <Input
                        id="instrucao"
                        value={instrucaoForm}
                        onChange={(e) => setInstrucaoForm(e.target.value)}
                        placeholder="Ex: Selecione até 2 itens"
                        disabled={isSubmitting}
                      />
                    </div>
                    {tipoSelecaoForm?.startsWith("CHECKBOX") && (
                      <div className="grid grid-cols-2 gap-4">
                        {tipoSelecaoForm === "CHECKBOX_OBRIGATORIO_MULTI" && (
                          <div className="space-y-1.5">
                            <Label htmlFor="minSelecoes">Mínimo</Label>
                            <Input
                              id="minSelecoes"
                              type="number"
                              value={minSelecoesForm ?? ""}
                              onChange={(e) =>
                                setMinSelecoesForm(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : undefined
                                )
                              }
                              min="0"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <Label htmlFor="maxSelecoes">Máximo</Label>
                          <Input
                            id="maxSelecoes"
                            type="number"
                            value={maxSelecoesForm ?? ""}
                            onChange={(e) =>
                              setMaxSelecoesForm(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            min="1"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Itens do Grupo */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Itens do Grupo</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleOpenAddItemOpcionalDialog}
                      disabled={isSubmitting}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {itensDoGrupoForm.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8 p-0 hidden sm:table-cell"></TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-right">
                              Preço Adic.
                            </TableHead>
                            <TableHead className="text-center">
                              Padrão
                            </TableHead>
                            <TableHead className="text-center w-[100px]">
                              Ações
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itensDoGrupoForm.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="p-1 hidden sm:table-cell">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="cursor-grab h-8 w-8"
                                  disabled
                                  title="Reordenar (Em breve)"
                                >
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.nome}
                              </TableCell>
                              <TableCell className="text-right">
                                R${" "}
                                {item.preco_adicional
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </TableCell>
                              <TableCell className="text-center">
                                <BadgeSimNao value={item.default_selecionado} />
                              </TableCell>
                              <TableCell className="text-center space-x-1">
                                <IconButton
                                  icon="pencil"
                                  onClick={() =>
                                    handleOpenEditItemOpcionalDialog(item)
                                  }
                                  disabled={isSubmitting}
                                />
                                <IconButton
                                  icon="trash"
                                  variant="destructive"
                                  onClick={() =>
                                    handleOpenDeleteItemOpcionalDialog(item)
                                  }
                                  disabled={isSubmitting}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum item adicionado a este grupo ainda.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar Grupo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ------------------ DIALOG ITEM ------------------ */}
      <Dialog
        open={isItemFormDialogOpen}
        onOpenChange={setIsItemFormDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentItemOpcional?.id ? "Editar" : "Adicionar"} Item ao Grupo
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleItemFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="nomeItem">Nome do Item</Label>
                <Input
                  id="nomeItem"
                  value={nomeItemForm}
                  onChange={(e) => setNomeItemForm(e.target.value)}
                  placeholder="Ex: Coca-Cola 310ml"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="precoAdicionalItem">Preço Adicional (R$)</Label>
                <Input
                  id="precoAdicionalItem"
                  type="text"
                  value={
                    precoAdicionalItemForm === 0
                      ? "0,00"
                      : precoAdicionalItemForm.toFixed(2).replace(".", ",")
                  }
                  onChange={(e) => {
                    const val = e.target.value.replace(",", ".");
                    setPrecoAdicionalItemForm(Number(val) || 0);
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="Ex: 2.50"
                />
                <FormDescription>
                  Se 0, o item não adiciona custo.
                </FormDescription>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isDefaultItem"
                  checked={isDefaultItemForm}
                  onCheckedChange={(checked) => setIsDefaultItemForm(!!checked)}
                />
                <Label htmlFor="isDefaultItem" className="text-sm font-normal">
                  Selecionar este item por padrão?
                </Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Salvar Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ------------------ ALERT DIALOGS ------------------ */}
      <AlertDialog
        open={isGrupoDeleteDialogOpen}
        onOpenChange={setIsGrupoDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão do Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo "{grupoToDelete?.nome}" e
              todos os seus itens? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setGrupoToDelete(null)}
              disabled={isSubmitting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGrupoConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Excluir Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isItemDeleteDialogOpen}
        onOpenChange={setIsItemDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção do Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o item "
              {itemOpcionalToDelete?.nome}" deste grupo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemOpcionalToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItemOpcionalConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Remover Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- DESCRIÇÃO PEQUENA ----------
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className="text-xs text-muted-foreground" {...props} />
));
FormDescription.displayName = "FormDescription";
