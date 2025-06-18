"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

interface Props {
  id: string;
}

export default function PizzaActionButtons({ id }: Props) {
  const router = useRouter();

  const excluirPizza = async () => {
    const ok = confirm("Excluir esta pizza? A ação é irreversível.");
    if (!ok) return;

    // remove imagem
    await supabaseBrowserClient.storage
      .from("public-assets")
      .remove([`pizzas/${id}.png`]);

    // remove registro
    const { error } = await supabaseBrowserClient
      .from("pizzas_personalizaveis")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Pizza excluída!" });
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* editar */}
      <Link href={`/admin/pizzas/${id}/editar`}>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </Link>

      {/* excluir */}
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10"
        onClick={excluirPizza}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
