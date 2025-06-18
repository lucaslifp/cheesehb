import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ToggleAtivoGeneric from "@/components/admin/ToggleAtivoGeneric";
import AdminActionButtons from "@/components/admin/AdminActionButtons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BordasPage() {
  const { data: bordas } = await supabaseServerClient
    .from("bordas_pizza")
    .select("id, nome, preco_pequena, preco_grande, ativo")
    .order("nome");

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Bordas de Pizza</h1>
        <Button asChild>
          <Link href="/admin/pizzas/bordas-pizza/nova">Adicionar Borda</Link>
        </Button>
      </div>

      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-100 text-sm">
            <th className="p-3 text-left">Nome</th>
            <th className="p-3 text-left">R$ Pequena</th>
            <th className="p-3 text-left">R$ Grande</th>
            <th className="p-3 text-left">Ativo</th>
            <th className="p-3 text-left">Ações</th>
          </tr>
        </thead>

        <tbody>
          {bordas?.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="p-3">{b.nome}</td>
              <td className="p-3">R$ {Number(b.preco_pequena).toFixed(2)}</td>
              <td className="p-3">R$ {Number(b.preco_grande).toFixed(2)}</td>

              <td className="p-3">
                <ToggleAtivoGeneric
                  table="bordas_pizza"
                  id={b.id}
                  ativoInicial={b.ativo}
                />
              </td>

              <td className="p-3">
                <AdminActionButtons
                  editHref={`/admin/pizzas/bordas-pizza/${b.id}/editar`}
                  table="bordas_pizza"
                  id={b.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
