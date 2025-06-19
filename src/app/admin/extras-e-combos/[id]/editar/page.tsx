import ComboGroupForm from "@/components/admin/ComboGroupForm";
import { supabaseServerClient as supabase } from "@/lib/supabaseServerClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export default async function EditarGrupoPage({ params }: Props) {
  const { data: grupo } = await supabase
    .from("grupos_opcionais")
    .select(`*, itens_opcionais(*)`)
    .eq("id", params.id)
    .single();

  if (!grupo) return notFound();

  return (
    <Dialog defaultOpen>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Grupo</DialogTitle>
        </DialogHeader>
        <ComboGroupForm
          defaultValues={{
            ...grupo,
            itens:
              grupo.itens_opcionais?.map((it: any) => ({
                id: it.id,
                nome: it.nome,
                preco_adicional: it.preco_adicional,
                ativo: it.ativo,
              })) ?? [],
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
