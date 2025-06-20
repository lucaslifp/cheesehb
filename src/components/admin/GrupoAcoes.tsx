"use client";

import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/admin/IconButton";

export default function GrupoAcoes({ id }: { id: string }) {
  return (
    <div className="flex gap-2">
      <IconButton
        icon={Pencil}
        tooltip="Editar"
        asLink={`/admin/extras-e-combos/${id}/editar`}
        variant="outline"
      />
      <IconButton icon={Trash2} tooltip="Excluir" variant="destructive" />
    </div>
  );
}
