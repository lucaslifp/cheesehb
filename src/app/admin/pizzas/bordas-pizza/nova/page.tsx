/* ----------------------------------------------------
 * Novo cadastro de Borda
 * --------------------------------------------------*/
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

export default function NovaBordaPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoPeq, setPrecoPeq] = useState("");
  const [precoGrande, setPrecoGrande] = useState("");

  async function handleSave() {
    if (!nome || !precoPeq || !precoGrande) {
      toast({
        title: "Campos obrigatórios!",
        description: "Preencha nome e preços.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabaseBrowserClient.from("bordas_pizza").insert({
      nome,
      descricao,
      preco_pequena: Number(precoPeq),
      preco_grande: Number(precoGrande),
    });

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Borda cadastrada!" });
      router.push("/admin/pizzas/bordas-pizza");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Adicionar Borda</h1>

      <div className="space-y-4">
        <div>
          <Label>Nome *</Label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Preço Pequena *</Label>
            <Input
              type="number"
              step="0.01"
              value={precoPeq}
              onChange={(e) => setPrecoPeq(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Preço Grande *</Label>
            <Input
              type="number"
              step="0.01"
              value={precoGrande}
              onChange={(e) => setPrecoGrande(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button onClick={handleSave}>Salvar</Button>

          {/* Cancelar */}
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/admin/pizzas/bordas-pizza")}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
