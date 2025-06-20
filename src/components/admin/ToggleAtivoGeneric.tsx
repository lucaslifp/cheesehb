"use client";

import { useState, useTransition } from "react";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";
import { Switch } from "@/components/ui/switch";

interface Props {
  table: string;
  id: string;
  ativoInicial: boolean;
}

export default function ToggleAtivoGeneric({ table, id, ativoInicial }: Props) {
  const [ativo, setAtivo] = useState(ativoInicial);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const novoValor = !ativo;

    // atualiza visualmente imediatamente
    setAtivo(novoValor);

    startTransition(async () => {
      const { error } = await supabaseBrowserClient
        .from(table)
        .update({ ativo: novoValor })
        .eq("id", id);

      if (error) {
        toast({ title: "Erro ao atualizar status", variant: "destructive" });
        setAtivo(ativo); // reverte visualmente
      } else {
        toast({
          title: `Status atualizado para ${novoValor ? "ativo" : "inativo"}`,
        });
      }
    });
  }

  return (
    <Switch checked={ativo} onCheckedChange={toggle} disabled={isPending} />
  );
}
