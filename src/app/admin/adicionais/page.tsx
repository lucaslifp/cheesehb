"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import AdicionalForm from "@/components/admin/AdicionalForm";
import AdicionalRow from "@/components/admin/AdicionalRow";

export default function AdicionaisPage() {
  const [adicionais, setAdicionais] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchAdicionais() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/adicionais", { cache: "no-store" });
      const data = await res.json();
      setAdicionais(data);
    } catch {
      toast({ title: "Erro ao buscar adicionais", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAdicionais();
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-4 py-10 lg:py-16">
      <h1 className="text-2xl font-headline font-bold">Adicionais</h1>

      <AdicionalForm onSuccess={fetchAdicionais} />

      <div className="rounded-lg border bg-card">
        <header className="border-b px-6 py-3 text-sm font-medium">
          Adicionais Cadastrados
        </header>

        {isLoading ? (
          <p className="p-6 text-muted-foreground">Carregando…</p>
        ) : adicionais.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nenhum adicional ainda.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-6 py-2 text-left">Nome</th>
                  <th className="px-6 py-2 text-left">Preço</th>
                  <th className="px-6 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {adicionais.map((a) => (
                  <AdicionalRow
                    key={a.id}
                    adicional={a}
                    onSuccess={fetchAdicionais}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
