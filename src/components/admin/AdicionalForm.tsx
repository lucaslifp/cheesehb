"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

function formatarParaReal(valor: string) {
  const numeros = valor.replace(/\D/g, "");
  const numero = parseFloat(numeros) / 100;
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function limparMascara(valor: string) {
  return parseFloat(valor.replace(/\D/g, "")) / 100;
}

export default function AdicionalForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [nome, setNome] = useState("");
  const [precoTexto, setPrecoTexto] = useState("R$ 0,00");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd() {
    const preco = limparMascara(precoTexto);
    if (!nome.trim()) {
      toast({ title: "Informe o nome", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const res = await fetch("/api/admin/adicionais", {
      method: "POST",
      body: JSON.stringify({ nome: nome.trim(), preco }),
    });

    if (!res.ok) {
      toast({
        title: "Erro",
        description: "Já existe ou servidor falhou",
        variant: "destructive",
      });
    } else {
      toast({ title: "Adicional cadastrado com sucesso!" });
      setNome("");
      setPrecoTexto("R$ 0,00");
      onSuccess?.(); // ✅ Atualiza listagem se fornecido
    }

    setIsLoading(false);
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-medium">Adicionar Novo Adicional</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
        <Input
          placeholder="Nome do adicional"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Input
          placeholder="R$ 0,00"
          value={precoTexto}
          onChange={(e) => setPrecoTexto(formatarParaReal(e.target.value))}
          className="text-right"
        />
      </div>
      <Button onClick={handleAdd} disabled={isLoading}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Adicional
      </Button>
    </div>
  );
}
