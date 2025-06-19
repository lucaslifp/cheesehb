import ComboGroupForm from "@/components/admin/ComboGroupForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function NovoGrupoPage() {
  return (
    <Dialog defaultOpen>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novo Grupo</DialogTitle>
        </DialogHeader>
        <ComboGroupForm />
      </DialogContent>
    </Dialog>
  );
}
