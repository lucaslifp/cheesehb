"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

export default function NovoSaborPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<"salgada" | "doce">("salgada");
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

    const { error } = await supabaseBrowserClient.from("sabores_pizza").insert({
      nome,
      descricao,
      categoria_sabor: categoria,
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
      toast({ title: "Sabor cadastrado!" });
      router.push("/admin/pizzas/sabores-pizza");
      router.refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Adicionar Sabor</h1>

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

        <div>
          <Label>Categoria (salgada / doce)</Label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as "salgada" | "doce")}
            className="w-full border rounded-md py-2 px-3"
          >
            <option value="salgada">Salgada</option>
            <option value="doce">Doce</option>
          </select>
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

        {/* Ações */}
        <div className="flex gap-4 pt-4">
          <Button onClick={handleSave}>Salvar</Button>

          {/* --- Botão Cancelar --- */}
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/admin/pizzas/sabores-pizza")}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
