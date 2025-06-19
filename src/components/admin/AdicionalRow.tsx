/* src/components/admin/AdicionalRow.tsx */
"use client";
import { useState } from "react";
import type { AdicionalPizza } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import { BadgeSimNao } from "@/components/admin/BadgeSimNao";
import { IconButton } from "@/components/admin/IconButton";
import { toast } from "@/hooks/use-toast";

export default function AdicionalRow({
  adicional,
}: {
  adicional: AdicionalPizza;
}) {
  const [ativo, setAtivo] = useState(adicional.ativo);

  async function toggleAtivo() {
    await fetch(`/api/admin/adicionais/${adicional.id}`, {
      method: "PATCH",
      body: JSON.stringify({ ativo: !ativo }),
    });
    setAtivo(!ativo);
  }

  async function handleDelete() {
    if (!confirm("Excluir adicional?")) return;
    await fetch(`/api/admin/adicionais/${adicional.id}`, { method: "DELETE" });
    toast({ title: "Adicional removido" });
    location.reload();
  }

  return (
    <tr className="border-t">
      <td className="px-6 py-3">{adicional.nome}</td>
      <td className="px-6 py-3">R$ {Number(adicional.preco).toFixed(2)}</td>
      <td className="px-6 py-3">
        <BadgeSimNao ativo={ativo} onClick={toggleAtivo} />
      </td>
      <td className="px-6 py-3">
        <IconButton icon={Pencil} tooltip="Editar (em breve)" disabled />
        <IconButton
          icon={Trash2}
          tooltip="Excluir"
          variant="destructive"
          onClick={handleDelete}
        />
      </td>
    </tr>
  );
}
