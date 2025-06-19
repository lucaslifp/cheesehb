/* ----------------------------------------------------------------
 * src/app/admin/adicionais/page.tsx
 * ----------------------------------------------------------------*/
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import type { AdicionalPizza } from "@/types";

import AdicionalForm from "@/components/admin/AdicionalForm";
import AdicionalRow from "@/components/admin/AdicionalRow";

export const dynamic = "force-dynamic";

export default async function AdicionaisPage() {
  /* ---------- fetch ---------- */
  const { data } = await supabaseServerClient
    .from("adicionais_pizza")
    .select("*")
    .order("nome", { ascending: true });

  const adicionais: AdicionalPizza[] = data ?? []; // 👈 antidoto para null

  /* ---------- UI ---------- */
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 px-4 py-10 lg:py-16">
      <h1 className="text-2xl font-headline font-bold">Adicionais</h1>

      {/* formulário (cadastra novo) */}
      <AdicionalForm />

      {/* listagem */}
      <div className="rounded-lg border bg-card">
        <header className="border-b px-6 py-3 text-sm font-medium">
          Adicionais Cadastrados
        </header>

        {adicionais.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nenhum adicional ainda.
          </p>
        ) : (
          /* scroll local p/ listas grandes */
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-6 py-2 text-left">Nome</th>
                  <th className="px-6 py-2 text-left">Preço</th>
                  <th className="px-6 py-2 text-left">Status</th>
                  <th className="px-6 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {adicionais.map((ad) => (
                  <AdicionalRow key={ad.id} adicional={ad} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
