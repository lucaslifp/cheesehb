import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ToggleAtivoGeneric from "@/components/admin/ToggleAtivoGeneric";
import AdminActionButtons from "@/components/admin/AdminActionButtons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SaboresPage() {
  const { data: sabores } = await supabaseServerClient
    .from("sabores_pizza")
    .select(
      "id, nome, descricao, ativo, categoria_sabor, preco_pequena, preco_grande"
    )
    .order("nome");

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Sabores de Pizza</h1>
        <Button asChild>
          <Link href="/admin/pizzas/sabores-pizza/novo">Adicionar Sabor</Link>
        </Button>
      </div>

      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-100 text-sm">
            <th className="p-3 text-left">Nome</th>
            <th className="p-3 text-left">Categoria</th>
            <th className="p-3 text-left">R$ Pequena</th>
            <th className="p-3 text-left">R$ Grande</th>
            <th className="p-3 text-left">Ativo</th>
            <th className="p-3 text-left">Ações</th>
          </tr>
        </thead>

        <tbody>
          {sabores?.map((s) => (
            <tr key={s.id} className="border-b">
              <td className="p-3">{s.nome}</td>
              <td className="p-3 capitalize">{s.categoria_sabor}</td>
              <td className="p-3">
                R$ {Number(s.preco_pequena).toFixed(2).replace(".", ",")}
              </td>
              <td className="p-3">
                R$ {Number(s.preco_grande).toFixed(2).replace(".", ",")}
              </td>

              <td className="p-3">
                <ToggleAtivoGeneric
                  table="sabores_pizza"
                  id={s.id}
                  ativoInicial={s.ativo}
                />
              </td>

              <td className="p-3">
                <AdminActionButtons
                  editHref={`/admin/pizzas/sabores-pizza/${s.id}/editar`}
                  table="sabores_pizza"
                  id={s.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
