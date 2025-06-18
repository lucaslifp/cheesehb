"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { supabaseBrowserClient as sb } from "@/lib/supabaseBrowserClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormValues = {
  nome: string;
  descricao: string;
  imagem: FileList;
  titulo_modal_personalizacao: string;
  categoria_id: string | null;
  ativo: boolean;
  tamanho_pizza: "pequena" | "grande";
  tipo_pizza: "salgada" | "doce" | "mista";
};

export default function EditarPizzaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>(
    []
  );
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  /* preview da nova imagem */
  const watchImg = watch("imagem");
  useEffect(() => {
    const file = watchImg?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }, [watchImg]);

  /* carrega pizza + categorias */
  useEffect(() => {
    (async () => {
      const { data: pizza, error } = await sb
        .from("pizzas_personalizaveis")
        .select("*")
        .eq("id", id)
        .single();

      const { data: cats } = await sb.from("categorias").select("id,nome");
      setCategorias(cats || []);

      if (error || !pizza) {
        toast({ title: "Erro ao buscar pizza.", variant: "destructive" });
        router.push("/admin/pizzas");
        return;
      }

      setPreview(pizza.imagem_url || null);
      reset({
        ...pizza,
        imagem: undefined as any, // RHF precisa
      });
    })();
  }, [id, reset, router]);

  /* submit */
  const onSubmit = async (v: FormValues) => {
    try {
      /* upload se houver novo arquivo */
      let imgUrl: string | undefined;
      const file = v.imagem?.[0];

      if (file) {
        const path = `pizzas/${id}.png`;
        // remove antiga (ignora erro se não existir)
        await sb.storage.from("public-assets").remove([path]);
        const { error: upErr } = await sb.storage
          .from("public-assets")
          .upload(path, file, { upsert: true });
        if (upErr) throw new Error(upErr.message);
        imgUrl = sb.storage.from("public-assets").getPublicUrl(path)
          .data.publicUrl;
      }

      /* update */
      const { error } = await sb
        .from("pizzas_personalizaveis")
        .update({
          nome: v.nome,
          descricao: v.descricao,
          titulo_modal_personalizacao: v.titulo_modal_personalizacao,
          categoria_id: v.categoria_id || null,
          ativo: v.ativo,
          tamanho_pizza: v.tamanho_pizza,
          tipo_pizza: v.tipo_pizza,
          ...(imgUrl && { imagem_url: imgUrl }),
        })
        .eq("id", id);

      if (error) throw new Error(error.message);

      toast({ title: "Pizza atualizada com sucesso!" });
      router.push("/admin/pizzas");
      router.refresh();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  /* UI */
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Editar Pizza</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nome */}
        <div>
          <Label>Nome *</Label>
          <Input {...register("nome", { required: true })} />
        </div>

        {/* Descrição */}
        <div>
          <Label>Descrição</Label>
          <Textarea {...register("descricao")} rows={3} />
        </div>

        {/* Preview + imagem */}
        <div>
          <Label>Imagem (substituir)</Label>
          <Input type="file" accept="image/*" {...register("imagem")} />
          {preview && (
            <img
              src={preview}
              alt="Pré-visualização"
              className="mt-3 h-32 w-auto rounded-md border"
            />
          )}
        </div>

        {/* Título do modal */}
        <div>
          <Label>Título do Modal *</Label>
          <Input
            {...register("titulo_modal_personalizacao", { required: true })}
          />
        </div>

        {/* Tamanho */}
        <div>
          <Label>Tamanho *</Label>
          <select
            {...register("tamanho_pizza", { required: true })}
            className="w-full border rounded-md py-2 px-3"
          >
            <option value="pequena">Pequena</option>
            <option value="grande">Grande</option>
          </select>
        </div>

        {/* Tipo */}
        <div>
          <Label>Tipo *</Label>
          <select
            {...register("tipo_pizza", { required: true })}
            className="w-full border rounded-md py-2 px-3"
          >
            <option value="mista">Mista</option>
            <option value="salgada">Salgada</option>
            <option value="doce">Doce</option>
          </select>
        </div>

        {/* Categoria */}
        <div>
          <Label>Categoria (opcional)</Label>
          <select
            {...register("categoria_id")}
            className="w-full border rounded-md py-2 px-3"
          >
            <option value="">Sem Categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Ativo */}
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register("ativo")} id="ativo" />
          <Label htmlFor="ativo">Ativo (aparece no cardápio)</Label>
        </div>

        {/* ações */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            Salvar Alterações
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/admin/pizzas")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
