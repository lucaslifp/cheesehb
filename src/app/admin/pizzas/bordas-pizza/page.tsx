"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";
import ToggleAtivoGeneric from "@/components/admin/ToggleAtivoGeneric";
import { Pencil, Trash2 } from "lucide-react";
import BordaEditModal from "@/components/admin/bordas-pizza/BordaEditModal";

interface Borda {
  id: string;
  nome: string;
  preco_pequena: number;
  preco_grande: number;
  ativo: boolean;
}

export default function BordasPage() {
  const [bordas, setBordas] = useState<Borda[]>([]);
  const [nome, setNome] = useState("");
  const [precoPequena, setPrecoPequena] = useState("");
  const [precoGrande, setPrecoGrande] = useState("");
  const [editando, setEditando] = useState<Borda | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    carregarBordas();
  }, []);

  async function carregarBordas() {
    const { data, error } = await supabaseBrowserClient
      .from("bordas_pizza")
      .select("*")
      .order("nome");
    if (!error && data) setBordas(data);
  }

  async function adicionarBorda() {
    if (!nome || !precoPequena || !precoGrande) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabaseBrowserClient.from("bordas_pizza").insert({
      nome,
      preco_pequena: Number(precoPequena.replace(",", ".")),
      preco_grande: Number(precoGrande.replace(",", ".")),
    });

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Borda adicionada!" });
      setNome("");
      setPrecoPequena("");
      setPrecoGrande("");
      carregarBordas();
    }
  }

  async function salvarEdicao(dadosAtualizados: Borda) {
    const { error } = await supabaseBrowserClient
      .from("bordas_pizza")
      .update({
        nome: dadosAtualizados.nome,
        preco_pequena: dadosAtualizados.preco_pequena,
        preco_grande: dadosAtualizados.preco_grande,
      })
      .eq("id", dadosAtualizados.id);

    if (error) {
      toast({ title: "Erro ao editar", variant: "destructive" });
    } else {
      toast({ title: "Borda atualizada!" });
      setEditando(null);
      carregarBordas();
    }
  }

  async function excluirBorda(id: string) {
    const { error } = await supabaseBrowserClient
      .from("bordas_pizza")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Borda excluída com sucesso!" });
      carregarBordas();
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Bordas da Pizza</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label>Nome da Borda</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <Label>Preço Pequena</Label>
          <Input
            value={precoPequena}
            onChange={(e) => setPrecoPequena(e.target.value)}
            placeholder="Ex: 2,00"
          />
        </div>
        <div>
          <Label>Preço Grande</Label>
          <Input
            value={precoGrande}
            onChange={(e) => setPrecoGrande(e.target.value)}
            placeholder="Ex: 4,00"
          />
        </div>
      </div>

      <Button
        onClick={adicionarBorda}
        className="mb-8 bg-red-600 hover:bg-red-700"
      >
        Adicionar Borda
      </Button>

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="p-3 text-left">Nome</th>
            <th className="p-3 text-left">R$ Pequena</th>
            <th className="p-3 text-left">R$ Grande</th>
            <th className="p-3 text-left">Ativo</th>
            <th className="p-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {bordas.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="p-3">{b.nome}</td>
              <td className="p-3">
                R$ {b.preco_pequena.toFixed(2).replace(".", ",")}
              </td>
              <td className="p-3">
                R$ {b.preco_grande.toFixed(2).replace(".", ",")}
              </td>
              <td className="p-3">
                <ToggleAtivoGeneric
                  table="bordas_pizza"
                  id={b.id}
                  ativoInicial={b.ativo}
                />
              </td>
              <td className="p-3 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditando(b)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => excluirBorda(b.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editando && (
        <BordaEditModal
          borda={editando}
          onClose={() => setEditando(null)}
          onSave={salvarEdicao}
        />
      )}
    </div>
  );
}
