/* --------------------------------------------------------------------------
 * src/components/admin/AdicionalRow.tsx
 * Reutilizado para a listagem de Adicionais
 * --------------------------------------------------------------------------*/
"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { IconButton } from "@/components/admin/IconButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface AdicionalRowProps {
  adicional: {
    id: string;
    nome: string;
    preco: number;
  };
  /** callback para atualizar a listagem no pai */
  onSuccess?: () => void;
}

export default function AdicionalRow({
  adicional,
  onSuccess,
}: AdicionalRowProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [nome, setNome] = useState(adicional.nome);
  const [preco, setPreco] = useState(
    adicional.preco.toFixed(2).replace(".", ",")
  );
  const [submitting, setSubmitting] = useState(false);

  /* utilidades ------------------------------------------------------------ */
  const stringParaNumero = (valor: string) =>
    Number(valor.replace(/\./g, "").replace(/,/g, "."));
  const formataBRL = (valor: number) => valor.toFixed(2).replace(".", ",");

  /* editar ---------------------------------------------------------------- */
  const handleSave = async () => {
    const body = {
      nome: nome.trim(),
      preco: stringParaNumero(preco),
    };
    if (!body.nome) {
      toast({ title: "Nome não pode ficar vazio", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/admin/adicionais/${adicional.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (!res.ok) {
      const { error } = await res.json();
      toast({
        title: "Erro ao salvar",
        description: error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Adicional atualizado!" });
    setIsEditOpen(false);
    onSuccess?.();
  };

  /* excluir --------------------------------------------------------------- */
  const handleDelete = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/admin/adicionais/${adicional.id}`, {
      method: "DELETE",
    });
    setSubmitting(false);
    if (!res.ok) {
      const { error } = await res.json();
      toast({
        title: "Erro ao excluir",
        description: error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Adicional removido" });
    setIsDeleteOpen(false);
    onSuccess?.();
  };

  /* render ---------------------------------------------------------------- */
  return (
    <tr key={adicional.id} className="group/row hover:bg-muted/40">
      <td className="px-6 py-2">{adicional.nome}</td>
      <td className="px-6 py-2">R$ {formataBRL(adicional.preco)}</td>
      <td className="px-6 py-2 text-right space-x-1">
        <IconButton
          icon={Pencil}
          tooltip="Editar"
          variant="outline"
          onClick={() => setIsEditOpen(true)}
        />
        <IconButton
          icon={Trash2}
          tooltip="Excluir"
          variant="destructive"
          onClick={() => setIsDeleteOpen(true)}
        />
      </td>

      {/* Modal de edição --------------------------------------------------- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Editar Adicional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              label="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <Input
              label="Preço"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
              className="text-right"
            />
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão ------------------------------------------- */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
          </AlertDialogHeader>
          <p>Deseja realmente excluir "{adicional.nome}"?</p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </tr>
  );
}
