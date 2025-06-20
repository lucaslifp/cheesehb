/* --------------------------------------------------------------------------
 * src/components/admin/GrupoForm.tsx – usado para Novo Grupo ou Edição
 * --------------------------------------------------------------------------*/
"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";
import type { GrupoOpcional } from "@/types";

interface Props {
  grupo?: GrupoOpcional;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

interface ItemRef {
  id: string;
  nome: string;
}

export default function GrupoForm({
  grupo,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const isEdit = !!grupo;

  const [nome, setNome] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [tipo, setTipo] = useState("RADIO_OBRIGATORIO");
  const [min, setMin] = useState<number | "">("");
  const [max, setMax] = useState<number | "">("");
  const [instrucao, setInstrucao] = useState("");

  const [itens, setItens] = useState<ItemRef[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function carregar() {
      const { data: addi } = await supabase
        .from("adicionais")
        .select("id,nome");
      const { data: prod } = await supabase.from("produtos").select("id,nome");
      const todos: ItemRef[] = [...(addi ?? []), ...(prod ?? [])];
      todos.sort((a, b) => a.nome.localeCompare(b.nome));
      setItens(todos);

      if (isEdit && grupo?.id) {
        setNome(grupo.nome ?? "");
        setAtivo(grupo.ativo ?? true);
        setTipo(grupo.tipo_selecao ?? "RADIO_OBRIGATORIO");
        setMin(grupo.min_selecoes ?? "");
        setMax(grupo.max_selecoes ?? "");
        setInstrucao(grupo.instrucao_personalizada ?? "");

        const { data: rel } = await supabase
          .from("grupos_opcionais_itens")
          .select("adicional_id")
          .eq("grupo_id", grupo.id);
        setSelecionados(rel?.map((r: any) => r.adicional_id) ?? []);
      } else {
        setNome("");
        setAtivo(true);
        setTipo("RADIO_OBRIGATORIO");
        setMin("");
        setMax("");
        setInstrucao("");
        setSelecionados([]);
      }
    }

    carregar();
  }, [open, grupo, isEdit]);

  const toggleItem = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const salvar = async () => {
    if (!nome.trim()) {
      toast({ title: "Informe o nome do grupo", variant: "destructive" });
      return;
    }
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
      toast({
        title: "Min não pode ser maior que Max",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    let grupoId = grupo?.id;
    const payload = {
      nome: nome.trim(),
      ativo,
      tipo_selecao: tipo,
      min_selecoes: min === "" ? null : Number(min),
      max_selecoes: max === "" ? null : Number(max),
      instrucao_personalizada: instrucao.trim() || null,
    };

    if (isEdit && grupoId) {
      const { error } = await supabase
        .from("grupos_opcionais")
        .update(payload)
        .eq("id", grupoId);
      if (error) {
        toast({ title: "Erro ao salvar", variant: "destructive" });
        setSubmitting(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("grupos_opcionais")
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast({ title: "Erro ao criar", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      grupoId = data!.id;
    }

    await supabase
      .from("grupos_opcionais_itens")
      .delete()
      .eq("grupo_id", grupoId);
    if (selecionados.length) {
      const rows = selecionados.map((adicional_id) => ({
        grupo_id: grupoId,
        adicional_id,
      }));
      await supabase.from("grupos_opcionais_itens").insert(rows);
    }

    toast({ title: isEdit ? "Grupo atualizado" : "Grupo criado" });
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{isEdit ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>

        <div className="mb-4 flex items-center gap-2 border-b pb-2">
          <ArrowLeft
            className="h-5 w-5 cursor-pointer"
            onClick={() => onOpenChange(false)}
          />
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-auto pr-2">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <Label>Nome do Grupo *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Label className="text-sm">Ativo</Label>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Tipo de Seleção *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RADIO_OBRIGATORIO">
                  Escolha única (obrigatório)
                </SelectItem>
                <SelectItem value="CHECKBOX_OPCIONAL_MULTI">
                  Múltipla (opcional)
                </SelectItem>
                <SelectItem value="CHECKBOX_OBRIGATORIO_MULTI">
                  Múltipla (obrigatória)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <Label>Min</Label>
              <Input
                type="number"
                min={0}
                value={min}
                onChange={(e) =>
                  setMin(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label>Max</Label>
              <Input
                type="number"
                min={1}
                value={max}
                onChange={(e) =>
                  setMax(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Instrução (opcional)</Label>
            <Input
              value={instrucao}
              onChange={(e) => setInstrucao(e.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="font-semibold">Itens do Grupo</h3>
            <ScrollArea className="h-48 rounded border p-2">
              {itens.map((item) => (
                <div key={item.id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    id={item.id}
                    checked={selecionados.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <Label htmlFor={item.id}>{item.nome}</Label>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div className="pt-2">
            <Button onClick={salvar} disabled={submitting}>
              {isEdit ? "Salvar alterações" : "Criar Grupo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
