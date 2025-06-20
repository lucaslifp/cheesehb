"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient as supabase } from "@/lib/supabaseBrowserClient";

interface Props {
  borda: {
    id: string;
    nome: string;
    preco_pequena: number;
    preco_grande: number;
  };
  onClose: () => void;
  onSave: (bordaAtualizada: {
    id: string;
    nome: string;
    preco_pequena: number;
    preco_grande: number;
  }) => void;
}

export default function BordaEditModal({ borda, onClose, onSave }: Props) {
  const [nome, setNome] = useState(borda.nome);
  const [precoPequena, setPrecoPequena] = useState(
    borda.preco_pequena.toFixed(2).replace(".", ",")
  );
  const [precoGrande, setPrecoGrande] = useState(
    borda.preco_grande.toFixed(2).replace(".", ",")
  );
  const [saving, setSaving] = useState(false);

  async function salvarAlteracoes() {
    if (!nome || !precoPequena || !precoGrande) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      nome,
      preco_pequena: Number(precoPequena.replace(",", ".")),
      preco_grande: Number(precoGrande.replace(",", ".")),
    };

    const { error } = await supabase
      .from("bordas_pizza")
      .update(payload)
      .eq("id", borda.id);

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Borda atualizada!" });
      onSave({ id: borda.id, ...payload });
      onClose();
    }
    setSaving(false);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Borda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preço Pequena</Label>
              <Input
                value={precoPequena}
                onChange={(e) => setPrecoPequena(e.target.value)}
              />
            </div>
            <div>
              <Label>Preço Grande</Label>
              <Input
                value={precoGrande}
                onChange={(e) => setPrecoGrande(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={salvarAlteracoes} disabled={saving}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
