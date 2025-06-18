"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

interface Props {
  editHref: string;
  table: string; // tabela alvo p/ DELETE
  id: string;
  storagePath?: string | null; // ex: "public-assets/pizzas/{id}.png"
}

export default function AdminActionButtons({
  editHref,
  table,
  id,
  storagePath,
}: Props) {
  const [isPending, start] = useTransition();

  async function excluir() {
    const ok = confirm("Excluir item? Esta ação é irreversível.");
    if (!ok) return;

    start(async () => {
      // remove a imagem, se informada
      if (storagePath) {
        await supabaseBrowserClient.storage
          .from("public-assets")
          .remove([storagePath]);
      }

      const { error } = await supabaseBrowserClient
        .from(table)
        .delete()
        .eq("id", id);

      if (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      } else {
        toast({ title: "Excluído com sucesso!" });
        location.reload();
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Link href={editHref}>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10"
        onClick={excluir}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
