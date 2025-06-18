"use client";

import { useState } from "react";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";
import { toast } from "@/hooks/use-toast";

interface Props {
  id: string;
  ativoInicial: boolean;
}

export default function TogglePizzaAtivo({ id, ativoInicial }: Props) {
  const [ativo, setAtivo] = useState(ativoInicial);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);

    const { error } = await supabaseBrowserClient
      .from("pizzas_personalizaveis")
      .update({ ativo: !ativo })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAtivo(!ativo);
    }
    setLoading(false);
  }

  /**
   * Visual idêntico ao chip da listagem de Categorias
   * - verde ⇒ ativo
   * - cinza ⇒ inativo
   */
  return (
    <button
      onClick={handleToggle}
      className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold
        ${ativo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}
        hover:opacity-80 transition`}
      disabled={loading}
    >
      {ativo ? "Sim" : "Não"}
    </button>
  );
}
