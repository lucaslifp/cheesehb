"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/admin/IconButton";
import { BadgeSimNao } from "@/components/admin/BadgeSimNao";
import { Plus, Trash2 } from "lucide-react";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "Obrigatório"),
  tipo_selecao: z.enum([
    "RADIO_OBRIGATORIO",
    "CHECKBOX_OPCIONAL_MULTI",
    "CHECKBOX_OBRIGATORIO_MULTI",
  ]),
  min_selecoes: z.number().int().nullable().optional(),
  max_selecoes: z.number().int().nullable().optional(),
  instrucao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  itens: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        nome: z.string().min(1),
        preco_adicional: z.number().min(0),
        ativo: z.boolean().default(true),
      })
    )
    .min(1, "Inclua pelo menos um item"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: FormValues;
}

export default function ComboGroupForm({ defaultValues }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
  } = useForm<FormValues>({
    defaultValues: defaultValues ?? {
      nome: "",
      tipo_selecao: "RADIO_OBRIGATORIO",
      ativo: true,
      itens: [{ nome: "", preco_adicional: 0, ativo: true }],
    },
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.id) {
        // update
        const { error } = await supabase
          .from("grupos_opcionais")
          .update({
            nome: data.nome,
            tipo_selecao: data.tipo_selecao,
            min_selecoes: data.min_selecoes,
            max_selecoes: data.max_selecoes,
            instrucao: data.instrucao,
            ativo: data.ativo,
          })
          .eq("id", data.id);
        if (error) throw error;

        // simples — remove e insere (poderia ser upsert se preferir)
        await supabase
          .from("itens_opcionais")
          .delete()
          .eq("grupo_opcional_id", data.id);
        const itens = data.itens.map((it) => ({
          ...it,
          grupo_opcional_id: data.id!,
        }));
        await supabase.from("itens_opcionais").insert(itens);
      } else {
        // create
        const { data: newGroup, error } = await supabase
          .from("grupos_opcionais")
          .insert({
            nome: data.nome,
            tipo_selecao: data.tipo_selecao,
            min_selecoes: data.min_selecoes,
            max_selecoes: data.max_selecoes,
            instrucao: data.instrucao,
            ativo: data.ativo,
          })
          .select()
          .single();
        if (error || !newGroup) throw error;

        const itens = data.itens.map((it) => ({
          ...it,
          grupo_opcional_id: newGroup.id,
        }));
        await supabase.from("itens_opcionais").insert(itens);
      }

      toast({ title: "Grupo salvo!" });
      router.push("/admin/extras-e-combos");
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Grupo */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Nome do Grupo *</Label>
          <Input {...register("nome")} />
          {errors.nome && (
            <p className="text-xs text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div>
          <Label>Ativo</Label>
          <Checkbox {...register("ativo")} />
        </div>

        <div>
          <Label>Tipo de Seleção *</Label>
          <select {...register("tipo_selecao")} className="w-full border p-2">
            <option value="RADIO_OBRIGATORIO">Radio (obrigatório)</option>
            <option value="CHECKBOX_OPCIONAL_MULTI">
              Checkbox (opcional multi)
            </option>
            <option value="CHECKBOX_OBRIGATORIO_MULTI">
              Checkbox (obrigatório multi)
            </option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Min</Label>
            <Input
              type="number"
              {...register("min_selecoes", { valueAsNumber: true })}
            />
          </div>
          <div className="flex-1">
            <Label>Max</Label>
            <Input
              type="number"
              {...register("max_selecoes", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Instrução (opcional)</Label>
          <Input {...register("instrucao")} />
        </div>
      </div>

      {/* Itens --------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Itens do Grupo</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ nome: "", preco_adicional: 0, ativo: true })
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Item
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid md:grid-cols-5 gap-2 border p-3 rounded-md"
          >
            <div className="md:col-span-2">
              <Label>Nome</Label>
              <Input {...register(`itens.${index}.nome` as const)} />
            </div>

            <div>
              <Label>Preço Adic.</Label>
              <Input
                type="number"
                step="0.01"
                {...register(`itens.${index}.preco_adicional`, {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label>Ativo</Label>
              <Checkbox {...register(`itens.${index}.ativo` as const)} />
            </div>

            <div className="flex items-center justify-end">
              <IconButton
                icon={Trash2}
                variant="destructive"
                tooltip="Remover item"
                onClick={() => remove(index)}
              />
            </div>
          </div>
        ))}

        {errors.itens && (
          <p className="text-xs text-destructive">
            {errors.itens.message?.toString()}
          </p>
        )}
      </div>

      {/* Footer -------------------------------------------------------- */}
      <DialogFooter className="pt-4">
        <Button type="submit" disabled={isSubmitting}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}
