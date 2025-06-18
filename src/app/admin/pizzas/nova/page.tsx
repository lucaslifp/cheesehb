"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

/* ─────────────────────────────────────────── */

export default function NovaPizzaPage() {
  const router = useRouter();

  /* campos */
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tituloModal, setTituloModal] = useState("Monte sua Pizza");

  /* imagem + preview */
  const [fileImg, setFileImg] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /* categoria e tamanho */
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [tamanho, setTamanho] = useState<"pequena" | "grande">("grande");

  /* ─────────────────────────────────────────── */
  /* carrega / cria categoria “Pizzas”           */
  useEffect(() => {
    (async () => {
      const sb = supabaseBrowserClient;
      const { data } = await sb.from("categorias").select("id,nome");
      let cat = data?.find((c) => c.nome === "Pizzas");

      if (!cat) {
        const { data: nova, error } = await sb
          .from("categorias")
          .insert({
            nome: "Pizzas",
            ordem: 0,
            mostrar_nos_filtros_homepage: true,
          })
          .select("id")
          .single();
        if (error) {
          toast({ title: "Erro ao criar categoria", variant: "destructive" });
          return;
        }
        cat = nova;
      }
      if (cat) setCategoriaId(cat.id);
    })();
  }, []);

  /* preview da imagem */
  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFileImg(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  /* ─────────────────────────────────────────── */
  async function handleSubmit() {
    if (!nome || !fileImg) {
      toast({
        title: "Nome e imagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const sb = supabaseBrowserClient;

    /* cria registro da pizza */
    const { data: pizza, error } = await sb
      .from("pizzas_personalizaveis")
      .insert({
        nome,
        descricao,
        titulo_modal_personalizacao: tituloModal,
        categoria_id: categoriaId,
        tamanho_pizza: tamanho, // pequena | grande
        tipo_pizza: "mista", // valor obrigatório
      })
      .select("id")
      .single();

    if (error || !pizza) {
      toast({
        title: "Erro ao cadastrar pizza",
        description: error?.message,
        variant: "destructive",
      });
      return;
    }

    /* upload da imagem */
    const path = `pizzas/${pizza.id}.png`;
    const { error: upErr } = await sb.storage
      .from("public-assets")
      .upload(path, fileImg, { upsert: true });

    if (upErr) {
      toast({
        title: "Erro no upload da imagem",
        description: upErr.message,
        variant: "destructive",
      });
      return;
    }

    const imgUrl = sb.storage.from("public-assets").getPublicUrl(path)
      .data.publicUrl;
    await sb
      .from("pizzas_personalizaveis")
      .update({ imagem_url: imgUrl })
      .eq("id", pizza.id);

    toast({ title: "Pizza cadastrada com sucesso!" });
    router.push("/admin/pizzas");
  }

  /* ─────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-xl font-bold">Cadastrar Nova Pizza</h1>

      <div className="space-y-4 mt-6">
        {/* Nome */}
        <div>
          <Label>Nome *</Label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <Label>Descrição</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
          />
        </div>

        {/* Imagem + preview */}
        <div>
          <Label>Imagem *</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            required
          />
          {preview && (
            <img
              src={preview}
              alt="Pré-visualização"
              className="mt-3 h-32 w-auto rounded-md border"
            />
          )}
        </div>

        {/* Tamanho */}
        <div>
          <Label>Tamanho *</Label>
          <select
            value={tamanho}
            onChange={(e) => setTamanho(e.target.value as "pequena" | "grande")}
            className="w-full border rounded-md py-2 px-3"
            required
          >
            <option value="pequena">Pequena Mista</option>
            <option value="grande">Grande Mista</option>
          </select>
        </div>

        {/* Título do modal */}
        <div>
          <Label>Título do Modal *</Label>
          <Input
            value={tituloModal}
            onChange={(e) => setTituloModal(e.target.value)}
            required
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSubmit}>Salvar Pizza</Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/pizzas")}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
