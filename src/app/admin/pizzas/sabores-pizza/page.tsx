"use client";

import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";
import AdminActionButtons from "@/components/admin/AdminActionButtons";
import ToggleAtivoGeneric from "@/components/admin/ToggleAtivoGeneric";

export default function SaboresPage() {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("salgada");
  const [precoPequena, setPrecoPequena] = useState("");
  const [precoGrande, setPrecoGrande] = useState("");
  const [sabores, setSabores] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  async function carregar() {
    const { data } = await supabase
      .from("sabores_pizza")
      .select("*")
      .order("nome");
    setSabores(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar() {
    if (!nome || !precoPequena || !precoGrande) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("sabores_pizza").insert({
      nome,
      descricao,
      categoria_sabor: categoria,
      preco_pequena: Number(precoPequena.replace(",", ".")),
      preco_grande: Number(precoGrande.replace(",", ".")),
    });

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Sabor adicionado!" });
      setNome("");
      setDescricao("");
      setCategoria("salgada");
      setPrecoPequena("");
      setPrecoGrande("");
      carregar();
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="bg-white rounded border p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-bold">Adicionar Novo Sabor</h1>

        <Input
          placeholder="Nome *"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <Textarea
          placeholder="Descrição (opcional)"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="salgada">Salgada</SelectItem>
            <SelectItem value="doce">Doce</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Preço Pequena *"
            value={precoPequena}
            onChange={(e) => setPrecoPequena(e.target.value)}
          />
          <Input
            placeholder="Preço Grande *"
            value={precoGrande}
            onChange={(e) => setPrecoGrande(e.target.value)}
          />
        </div>

        <Button onClick={adicionar} disabled={isPending}>
          Adicionar Sabor
        </Button>
      </div>

      <div className="bg-white rounded border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Sabores Cadastrados</h2>

        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Categoria</th>
              <th className="p-2 text-left">Pequena</th>
              <th className="p-2 text-left">Grande</th>
              <th className="p-2 text-left">Ativo</th>
              <th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sabores.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{s.nome}</td>
                <td className="p-2 capitalize">{s.categoria_sabor}</td>
                <td className="p-2">
                  R$ {Number(s.preco_pequena).toFixed(2).replace(".", ",")}
                </td>
                <td className="p-2">
                  R$ {Number(s.preco_grande).toFixed(2).replace(".", ",")}
                </td>
                <td className="p-2">
                  <ToggleAtivoGeneric
                    table="sabores_pizza"
                    id={s.id}
                    ativoInicial={s.ativo}
                  />
                </td>
                <td className="p-2">
                  <AdminActionButtons
                    editHref={`/admin/pizzas/sabores-pizza/${s.id}/editar`}
                    table="sabores_pizza"
                    id={s.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
