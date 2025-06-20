/* -------------------------------------------------------------------------- */
/*  src/app/admin/extras-e-combos/[id]/editar/page.tsx                         */
/* -------------------------------------------------------------------------- */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";

interface Adicional {
  id: string;
  nome: string;
}

export default function EditarGrupoPage() {
  const router = useRouter();
  const { id } = useParams();

  const [nome, setNome] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [tipo, setTipo] = useState("RADIO_OBRIGATORIO");
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(1);
  const [instrucao, setInstrucao] = useState("");
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  useEffect(() => {
    async function carregar() {
      const grupo = await supabase
        .from("grupos_opcionais")
        .select("*")
        .eq("id", id)
        .single();
      if (grupo.data) {
        setNome(grupo.data.nome);
        setAtivo(grupo.data.ativo);
        setTipo(grupo.data.tipo_selecao);
        setMin(grupo.data.min_selecoes ?? 0);
        setMax(grupo.data.max_selecoes ?? 1);
        setInstrucao(grupo.data.instrucao_personalizada ?? "");
      }

      const { data: todosAdicionais } = await supabase
        .from("adicionais")
        .select("id, nome")
        .order("nome");
      setAdicionais(todosAdicionais ?? []);

      const { data: relacionados } = await supabase
        .from("grupos_opcionais_itens")
        .select("adicional_id")
        .eq("grupo_id", id);

      setSelecionados(relacionados?.map((r) => r.adicional_id) ?? []);
    }
    carregar();
  }, [id]);

  const salvar = async () => {
    const { error: erroGrupo } = await supabase
      .from("grupos_opcionais")
      .update({
        nome,
        ativo,
        tipo_selecao: tipo,
        min_selecoes: min,
        max_selecoes: max,
        instrucao_personalizada: instrucao,
      })
      .eq("id", id);

    if (erroGrupo) {
      toast({ title: "Erro ao salvar grupo", variant: "destructive" });
      return;
    }

    await supabase.from("grupos_opcionais_itens").delete().eq("grupo_id", id);

    const novos = selecionados.map((adicional_id) => ({
      grupo_id: id,
      adicional_id,
    }));
    if (novos.length > 0) {
      await supabase.from("grupos_opcionais_itens").insert(novos);
    }

    toast({ title: "Grupo atualizado com sucesso" });
    router.push("/admin/extras-e-combos");
  };

  const toggleAdicional = (adicionalId: string) => {
    setSelecionados((prev) =>
      prev.includes(adicionalId)
        ? prev.filter((id) => id !== adicionalId)
        : [...prev, adicionalId]
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Editar Grupo</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Nome do Grupo *</Label>
          <Switch checked={ativo} onCheckedChange={setAtivo} />
        </div>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />

        <Label>Tipo de Seleção *</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger>
            <SelectValue />
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

        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Min</Label>
            <Input
              type="number"
              min={0}
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <Label>Max</Label>
            <Input
              type="number"
              min={1}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </div>
        </div>

        <Label>Instrução (opcional)</Label>
        <Input
          value={instrucao}
          onChange={(e) => setInstrucao(e.target.value)}
        />

        <div className="space-y-2 pt-6">
          <h2 className="font-semibold">Itens do Grupo</h2>
          {adicionais.map((ad) => (
            <div key={ad.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selecionados.includes(ad.id)}
                onChange={() => toggleAdicional(ad.id)}
              />
              <span>{ad.nome}</span>
            </div>
          ))}
        </div>
      </div>

      <Button className="mt-6" onClick={salvar}>
        Salvar
      </Button>
    </div>
  );
}
