"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";
import { BordaEditModal } from "./BordaEditModal";
import { Borda } from "@/types";

interface Props {
  borda: Borda;
  onUpdated: () => void;
}

export function BordaRow({ borda, onUpdated }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  async function excluir() {
    if (!confirm("Excluir borda?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("bordas_pizza")
      .delete()
      .eq("id", borda.id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Excluído com sucesso" });
      onUpdated();
    }
    setDeleting(false);
  }

  return (
    <>
      <tr className="border-b text-sm">
        <td className="p-3">{borda.nome}</td>
        <td className="p-3">
          R$ {Number(borda.preco_pequena).toFixed(2).replace(".", ",")}
        </td>
        <td className="p-3">
          R$ {Number(borda.preco_grande).toFixed(2).replace(".", ",")}
        </td>
        <td className="p-3 flex gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => setShowEdit(true)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive"
            onClick={excluir}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </td>
      </tr>

      <BordaEditModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        borda={borda}
        onSaved={onUpdated}
      />
    </>
  );
}
