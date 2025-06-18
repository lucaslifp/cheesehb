import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { supabaseServerClient as supabase } from "@/lib/supabaseServerClient";

export const dynamic = "force-dynamic";

export default async function AdminPizzasPage() {
  const { data: pizzas, error } = await supabase
    .from("pizzas_personalizaveis")
    .select("id, nome, ativo")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pizzas (Personalizáveis)</h1>
        <Button asChild>
          <Link href="/admin/pizzas/nova">Adicionar Nova Pizza</Link>
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="py-2 px-4">Nome</th>
              <th className="py-2 px-4">Ativo</th>
              <th className="py-2 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pizzas?.map((pizza) => (
              <tr
                key={pizza.id}
                className="border-t border-border hover:bg-muted/40"
              >
                <td className="py-2 px-4 font-medium">{pizza.nome}</td>
                <td className="py-2 px-4">{pizza.ativo ? "Sim" : "Não"}</td>
                <td className="py-2 px-4 text-right">
                  <Link href={`/admin/pizzas/${pizza.id}/editar`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {pizzas?.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-4 px-4 text-center text-muted-foreground"
                >
                  Nenhuma pizza cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
