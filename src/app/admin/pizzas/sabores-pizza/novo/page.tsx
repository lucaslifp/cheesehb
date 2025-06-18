"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

export default function NovoSaborPage() {
  const router = useRouter();
  const { handleSubmit, register, formState } = useForm();

  async function onSubmit(values: any) {
    const { error } = await supabaseBrowserClient.from("sabores_pizza").insert({
      nome: values.nome,
      descricao: values.descricao || null,
      categoria_sabor: values.categoria,
      preco_pequena: Number(values.preco_pequena),
      preco_grande: Number(values.preco_grande),
    });

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Sabor criado!" });
      router.push("/admin/pizzas/sabores-pizza");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-6">Adicionar Sabor</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Nome *</Label>
          <Input {...register("nome", { required: true })} />
        </div>

        <div>
          <Label>Descrição</Label>
          <Input {...register("descricao")} />
        </div>

        <div>
          <Label>Categoria (salgada / doce)</Label>
          <select
            {...register("categoria", { required: true })}
            className="border rounded-md w-full py-2 px-3"
          >
            <option value="salgada">Salgada</option>
            <option value="doce">Doce</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Preço Pequena *</Label>
            <Input
              type="number"
              step="0.01"
              {...register("preco_pequena", { required: true })}
            />
          </div>
          <div>
            <Label>Preço Grande *</Label>
            <Input
              type="number"
              step="0.01"
              {...register("preco_grande", { required: true })}
            />
          </div>
        </div>

        <Button disabled={formState.isSubmitting}>Salvar</Button>
      </form>
    </div>
  );
}
