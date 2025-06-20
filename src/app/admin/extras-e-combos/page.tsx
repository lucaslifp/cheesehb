/* -------------------------------------------------------------------------- */
/*  src/app/admin/extras-e-combos/page.tsx   –  listagem + modal Novo/Editar  */
/* -------------------------------------------------------------------------- */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { IconButton } from "@/components/admin/IconButton";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";
import type { GrupoOpcional } from "@/types";
import GrupoForm from "@/components/admin/GrupoForm";

export default function AdminExtrasCombosPage() {
  const [grupos, setGrupos] = useState<GrupoOpcional[]>([]);
  const [loading, setLoading] = useState(true);

  /* modal controls */
  const [openForm, setOpenForm] = useState(false);
  const [grupoEdit, setGrupoEdit] = useState<GrupoOpcional | undefined>();

  async function fetchGrupos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("grupos_opcionais")
      .select("*")
      .order("ordem");
    if (error)
      toast({ title: "Erro ao carregar grupos", variant: "destructive" });
    setGrupos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchGrupos();
  }, []);

  /* inline toggle status */
  async function toggleStatus(id: string, v: boolean) {
    const { error } = await supabase
      .from("grupos_opcionais")
      .update({ ativo: v })
      .eq("id", id);
    if (error) return toast({ title: "Erro", variant: "destructive" });
    setGrupos((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ativo: v } : g))
    );
  }

  /* abrir para novo */
  const openNovo = () => {
    setGrupoEdit(undefined);
    setOpenForm(true);
  };

  /* abrir para edição */
  const openEditar = (g: GrupoOpcional) => {
    setGrupoEdit(g);
    setOpenForm(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-16 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold">Extras & Combos</h1>
        <Button onClick={openNovo}>
          <Plus className="mr-2 h-4 w-4" /> Novo Grupo
        </Button>
      </header>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-6 py-3 text-sm font-medium">
          Listagem de Grupos
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Max</TableHead>
              <TableHead>Instrução</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{g.nome}</TableCell>
                <TableCell>
                  <Switch
                    checked={g.ativo}
                    onCheckedChange={(v) => toggleStatus(g.id, v)}
                  />
                </TableCell>
                <TableCell>
                  {g.tipo_selecao === "RADIO_OBRIGATORIO" && "Única"}
                  {g.tipo_selecao === "CHECKBOX_OPCIONAL_MULTI" &&
                    "Multi (opc.)"}
                  {g.tipo_selecao === "CHECKBOX_OBRIGATORIO_MULTI" &&
                    "Multi (obrig.)"}
                </TableCell>
                <TableCell>{g.min_selecoes ?? "-"}</TableCell>
                <TableCell>{g.max_selecoes ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {g.instrucao_personalizada || "–"}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <IconButton
                    icon={Pencil}
                    tooltip="Editar"
                    onClick={() => openEditar(g)}
                  />
                  <IconButton
                    icon={Trash2}
                    tooltip="Excluir"
                    variant="destructive"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal Novo / Editar ------------------------------------------------ */}
      <GrupoForm
        open={openForm}
        onOpenChange={setOpenForm}
        grupo={grupoEdit}
        onSuccess={fetchGrupos}
      />
    </div>
  );
}
