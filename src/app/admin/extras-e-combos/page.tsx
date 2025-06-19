/* -------------------------------------------------------------------------- */
/*  src/app/admin/extras-e-combos/page.tsx                                    */
/* -------------------------------------------------------------------------- */
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import type { GrupoOpcional } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BadgeSimNao } from "@/components/admin/BadgeSimNao";
import { IconButton } from "@/components/admin/IconButton";

export const dynamic = "force-dynamic";

export default async function AdminExtrasCombosPage() {
  const { data: grupos = [] } = await supabaseServerClient
    .from("grupos_opcionais")
    .select("*")
    .order("ordem", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-16">
      {/* Cabeçalho -------------------------------------------------------- */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-headline font-bold">
          Extras&nbsp;&amp;&nbsp;Combos
        </h1>

        <Button asChild>
          <Link href="/admin/extras-e-combos/nova">
            <Plus className="mr-2 h-5 w-5" />
            Novo&nbsp;Grupo
          </Link>
        </Button>
      </header>

      {/* Empty-state ------------------------------------------------------ */}
      {grupos.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center text-muted-foreground">
          <p className="text-xl font-semibold">
            Nenhum grupo de opcionais cadastrado.
          </p>
          <Button asChild>
            <Link href="/admin/extras-e-combos/nova">
              <Plus className="mr-2 h-5 w-5" />
              Criar primeiro grupo
            </Link>
          </Button>
        </div>
      )}

      {/* Grade de cards --------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {grupos.map((g: GrupoOpcional) => (
          <article
            key={g.id}
            className="relative rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* título + status */}
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-medium leading-snug">{g.nome}</h2>
              <BadgeSimNao ativo={g.ativo} />
            </div>

            {/* info rápida */}
            <p className="mb-6 text-sm text-muted-foreground">
              Tipo:&nbsp;
              {g.tipo_selecao === "RADIO_OBRIGATORIO" && "Escolha Única"}
              {g.tipo_selecao === "CHECKBOX_OPCIONAL_MULTI" &&
                "Múltipla Opcional"}
              {g.tipo_selecao === "CHECKBOX_OBRIGATORIO_MULTI" &&
                "Múltipla Obrigatória"}
              {g.max_selecoes
                ? ` • Máx. ${g.max_selecoes}`
                : g.min_selecoes
                ? ` • Min. ${g.min_selecoes}`
                : null}
            </p>

            {/* ações */}
            <div className="flex gap-2">
              <IconButton
                icon={Pencil}
                tooltip="Editar"
                asLink={`/admin/extras-e-combos/${g.id}/editar`}
                variant="outline"
              />
              <IconButton
                icon={Trash2}
                tooltip="Excluir"
                variant="destructive"
                /* onClick={() => … } */
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
