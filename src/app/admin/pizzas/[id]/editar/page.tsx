// src/app/admin/pizzas/[id]/editar/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

export default function EditarPizzaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [pizza, setPizza] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchPizza = async () => {
      const { data, error } = await supabaseBrowserClient
        .from("pizzas_personalizaveis")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        toast({ title: "Erro ao carregar pizza" });
        return;
      }

      setPizza(data);
    };
    fetchPizza();
  }, [params.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imagem_url = pizza.imagem_url;

    if (imageFile) {
      const path = `public-assets/produtos/${pizza.id}.main.png`;
      const { error: uploadError } = await supabaseBrowserClient.storage
        .from("public-assets")
        .upload(path, imageFile, { upsert: true });

      if (uploadError) {
        toast({ title: "Erro ao fazer upload da imagem" });
        setLoading(false);
        return;
      }

      imagem_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
    }

    const { error } = await supabaseBrowserClient
      .from("pizzas_personalizaveis")
      .update({ ...pizza, imagem_url })
      .eq("id", pizza.id);

    if (error) {
      toast({ title: "Erro ao atualizar pizza" });
    } else {
      toast({ title: "Pizza atualizada com sucesso" });
      router.push("/admin/pizzas");
    }

    setLoading(false);
  };

  if (!pizza) return <p>Carregando...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Label>Nome</Label>
      <Input
        value={pizza.nome || ""}
        onChange={(e) => setPizza({ ...pizza, nome: e.target.value })}
      />

      <Label>Descrição</Label>
      <Textarea
        value={pizza.descricao || ""}
        onChange={(e) => setPizza({ ...pizza, descricao: e.target.value })}
      />

      <Label>Título do Modal</Label>
      <Input
        value={pizza.titulo_modal_personalizacao || ""}
        onChange={(e) =>
          setPizza({ ...pizza, titulo_modal_personalizacao: e.target.value })
        }
      />

      <Label>Imagem</Label>
      <Input type="file" accept="image/*" onChange={handleImageChange} />

      {pizza.imagem_url && (
        <Image
          src={pizza.imagem_url}
          alt="Imagem atual"
          width={200}
          height={200}
          className="rounded-xl border"
        />
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
