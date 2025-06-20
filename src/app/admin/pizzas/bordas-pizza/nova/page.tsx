"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";

export default function NovaBordaPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoPequena, setPrecoPequena] = useState("");
  const [precoGrande, setPrecoGrande] = useState("");
  const [loading, setLoading] = useState(false);

  async function salvar() {
    if (!nome || !precoPequena || !precoGrande) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const precoPeq = Number(precoPequena.replace(",", "."));
    const precoGra = Number(precoGrande.replace(",", "."));

    if (isNaN(precoPeq) || isNaN(precoGra)) {
      toast({ title: "Preços inválidos", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("bordas_pizza").insert({
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      preco_pequena: precoPeq,
      preco_grande: precoGra,
      ativo: true,
    });

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Borda cadastrada com sucesso!" });
      router.push("/admin/pizzas/bordas-pizza");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Adicionar Nova Borda</h1>

      <div className="space-y-4">
        <div>
          <Label>Nome *</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>

        <div>
          <Label>Descrição (opcional)</Label>
          <Textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Preço para Pizza Pequena *</Label>
            <Input
              value={precoPequena}
              onChange={(e) => setPrecoPequena(e.target.value)}
              placeholder="Ex: 5,00"
            />
          </div>
          <div>
            <Label>Preço para Pizza Grande *</Label>
            <Input
              value={precoGrande}
              onChange={(e) => setPrecoGrande(e.target.value)}
              placeholder="Ex: 8,00"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={salvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Borda"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/pizzas/bordas-pizza")}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
