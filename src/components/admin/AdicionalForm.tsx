/* src/components/admin/AdicionalForm.tsx */
"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function AdicionalForm() {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState<number>(0);

  async function handleAdd() {
    if (!nome.trim()) return toast({ title: "Informe o nome" });
    const res = await fetch("/api/admin/adicionais", {
      method: "POST",
      body: JSON.stringify({ nome: nome.trim(), preco }),
    });
    if (!res.ok) {
      return toast({
        title: "Erro",
        description: "Já existe ou servidor falhou",
        variant: "destructive",
      });
    }
    location.reload();
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
          type="number"
          min={0}
          step={0.01}
          value={preco}
          onChange={(e) => setPreco(Number(e.target.value))}
        />
      </div>
      <Button onClick={handleAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Adicional
      </Button>
    </div>
  );
}
