"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";
import { v4 as uuidv4 } from "uuid";

export default function NovaPizzaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [tamanho, setTamanho] = useState("");
  const [titulo_modal, setTituloModal] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nome || !imagem || !tamanho || !titulo_modal) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const pizzaId = uuidv4();

    const { error: insertError } = await supabase
      .from("pizzas_personalizaveis")
      .insert({
        id: pizzaId,
        nome,
        descricao,
        tamanho,
        titulo_modal,
        ativo: true,
      });

    if (insertError) {
      toast({
        title: "Erro ao salvar",
        description: insertError.message,
        variant: "destructive",
      });
      return;
    }

    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(`pizzas/${pizzaId}.png`, imagem, {
        cacheControl: "3600",
        upsert: true,
        contentType: imagem.type,
      });

    if (uploadError) {
      toast({
        title: "Pizza salva, mas houve erro ao enviar a imagem",
        variant: "destructive",
      });
    } else {
      toast({ title: "Pizza cadastrada com sucesso!" });
    }

    router.push("/admin/pizzas");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Cadastrar Nova Pizza</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          <Label>Imagem *</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImagem(e.target.files?.[0] || null)}
            required
          />
        </div>

        <div>
          <Label>Tamanho *</Label>
          <select
            value={tamanho}
            onChange={(e) => setTamanho(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          >
            <option value="">Selecione o tamanho</option>
            <option value="PEQUENA">Pequena</option>
            <option value="GRANDE">Grande</option>
          </select>
        </div>

        <div>
          <Label>Título do Modal *</Label>
          <Input
            value={titulo_modal}
            onChange={(e) => setTituloModal(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            Salvar Pizza
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/pizzas")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
