"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  editHref: string;
  table: string;
  id: string;
  storagePath?: string | null;
}

export default function AdminActionButtons({
  editHref,
  table,
  id,
  storagePath,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function excluir() {
    startTransition(async () => {
      if (storagePath) {
        await supabaseBrowserClient.storage
          .from("public-assets")
          .remove([storagePath]);
      }

      const { error } = await supabaseBrowserClient
        .from(table)
        .delete()
        .eq("id", id);

      if (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      } else {
        toast({ title: "Item excluído com sucesso" });
        location.reload();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => router.push(editHref)}
              disabled={isPending}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Editar</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={excluir}
              size="icon"
              variant="outline"
              className="h-8 w-8 text-red-600 hover:bg-red-50"
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Excluir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
