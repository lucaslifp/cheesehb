import Link from "next/link";
import Image from "next/image";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import TogglePizzaAtivo from "@/components/admin/TogglePizzaAtivo";
import PizzaActionButtons from "@/components/admin/PizzaActionButtons";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PizzaRow {
  id: string;
  nome: string;
  ativo: boolean;
  imagem_url: string | null;
}

export default async function PizzasAdminPage() {
  const { data: pizzas } = await supabaseServerClient
    .from("pizzas_personalizaveis")
    .select("id, nome, ativo, imagem_url")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pizzas&nbsp;(Personalizáveis)</h1>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/pizzas/sabores-pizza">
              Gerenciar&nbsp;Sabores
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/pizzas/bordas-pizza">Gerenciar&nbsp;Bordas</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/pizzas/nova">
              Adicionar&nbsp;Nova&nbsp;Pizza
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="mt-8">
        {pizzas && pizzas.length ? (
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="p-3 text-left">Imagem</th>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Ativo</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {pizzas.map((pizza: PizzaRow) => (
                <tr key={pizza.id} className="border-b">
                  <td className="p-3">
                    {pizza.imagem_url && (
                      <Image
                        src={pizza.imagem_url}
                        alt={pizza.nome}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                      />
                    )}
                  </td>

                  <td className="p-3">{pizza.nome}</td>

                  <td className="p-3">
                    <TogglePizzaAtivo
                      id={pizza.id}
                      ativoInicial={pizza.ativo}
                    />
                  </td>

                  <td className="p-3">
                    {/* Botões interativos (client component) */}
                    <PizzaActionButtons id={pizza.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center p-8 text-muted-foreground">
            Nenhuma pizza cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}
