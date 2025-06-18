"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

interface Props {
  table: string; // ex: "pizzas_personalizaveis"
  id: string;
  ativoInicial: boolean;
}

export default function ToggleAtivoGeneric({ table, id, ativoInicial }: Props) {
  const [isPending, start] = useTransition();
  const ativo = ativoInicial;

  async function toggle() {
    start(async () => {
      const { error } = await supabaseBrowserClient
        .from(table)
        .update({ ativo: !ativo })
        .eq("id", id)
        .single();

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Status salvo!" });
        location.reload(); // simples e eficaz p/ manter SSR
      }
    });
  }

  return (
    <button
      disabled={isPending}
      onClick={toggle}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
        ativo
          ? "bg-emerald-100 text-emerald-700"
          : "bg-destructive text-destructive-foreground"
      )}
    >
      {ativo ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {ativo ? "Sim" : "Não"}
    </button>
  );
}
