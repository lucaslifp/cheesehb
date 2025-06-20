"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";

export default function EditarBordaPizzaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [nome, setNome] = useState("");
  const [precoPequena, setPrecoPequena] = useState("");
  const [precoGrande, setPrecoGrande] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      const { data, error } = await supabase
        .from("bordas_pizza")
        .select("nome, preco_pequena, preco_grande")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast({ title: "Borda não encontrada", variant: "destructive" });
        router.push("/admin/pizzas/bordas-pizza");
        return;
      }

      setNome(data.nome);
      setPrecoPequena(String(data.preco_pequena).replace(".", ","));
      setPrecoGrande(String(data.preco_grande).replace(".", ","));
      setLoading(false);
    }

    carregarDados();
  }, [id, router]);

  async function salvar() {
    const { error } = await supabase
      .from("bordas_pizza")
      .update({
        nome,
        preco_pequena: Number(precoPequena.replace(",", ".")),
        preco_grande: Number(precoGrande.replace(",", ".")),
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Borda atualizada!" });
      router.push("/admin/pizzas/bordas-pizza");
    }
  }

  if (loading) return <p className="p-6">Carregando…</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Editar Borda da Pizza</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input
          placeholder="Nome da Borda"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Input
          placeholder="Preço Pequena"
          value={precoPequena}
          onChange={(e) => setPrecoPequena(e.target.value)}
        />
        <Input
          placeholder="Preço Grande"
          value={precoGrande}
          onChange={(e) => setPrecoGrande(e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <Button
          onClick={salvar}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Salvar Alterações
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/pizzas/bordas-pizza")}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
