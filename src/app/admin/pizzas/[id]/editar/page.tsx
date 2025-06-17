
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"; // Changed from useSearchParams
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { UploadCloud, Loader2 } from "lucide-react";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";
import type { Database } from "@/types/supabase"; // Import Supabase Database type
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Directly use the Supabase generated type for a row in the 'produtos' table
type ProdutoRow = Database["public"]["Tables"]["produtos"]["Row"];

export default function EditarPizzaPage() {
  const router = useRouter();
  const params = useParams(); // Use useParams to get route parameters
  const pizzaId = params.id as string; // id should be part of the route path, e.g., /admin/pizzas/[id]/editar

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState<ProdutoRow | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!pizzaId) {
        setLoading(false);
        toast({ title: "Erro", description: "ID da pizza não fornecido.", variant: "destructive"});
        router.push("/admin/pizzas"); // Redirect if no ID
        return;
    }

    async function fetchPizza() {
      setLoading(true);
      const { data, error } = await supabaseBrowserClient
        .from("produtos") // Fetch from 'produtos' table
        .select("*")
        .eq("id", pizzaId)
        .eq("is_personalizable_pizza", true) // Ensure it's a personalizable pizza
        .single();

      if (error || !data) {
        toast({ title: "Erro ao carregar pizza", description: error?.message || "Pizza não encontrada ou não é personalizável." });
        setLoading(false);
        router.push("/admin/pizzas"); // Redirect if not found or not personalizable
      } else {
        setForm(data);
        setImagemPreview(data.imagem_url);
        setLoading(false);
      }
    }

    fetchPizza();
  }, [pizzaId, router]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    // For personalizable pizzas, we might not have a specific "product id" for the image yet,
    // or we might want a generic image for the "Monte sua Pizza" card.
    // Using a generic name or the pizza base ID is fine.
    const filePath = `public-assets/produtos/${form.id}.main.png`; // Using produto ID
    const { error } = await supabaseBrowserClient.storage.from("public-assets").upload(filePath, file, {
      upsert: true,
    });

    if (error) {
      toast({ title: "Erro ao enviar imagem", description: error.message });
      return;
    }

    const {data: {publicUrl}} = supabaseBrowserClient.storage.from("public-assets").getPublicUrl(filePath);
    if(form){ // Check if form is not null
        setForm({ ...form, imagem_url: publicUrl });
    }
    setImagemPreview(publicUrl);
  }

  async function salvar() {
    if (!form) return;
    setSalvando(true);
    
    // Prepare data for update, ensuring available_sizes is handled correctly
    const updateData: Partial<ProdutoRow> = {
        nome: form.nome,
        imagem_url: form.imagem_url,
        mostrar_no_cardapio: form.mostrar_no_cardapio,
        ativo: form.ativo,
        tipo_pizza: form.tipo_pizza, // This should be 'salgada' or 'doce'
        available_sizes: form.available_sizes, // This should be ['pequena'] or ['grande']
        // Ensure is_personalizable_pizza remains true and preco_base is null or 0
        is_personalizable_pizza: true,
        preco_base: null, // Personalizable pizzas don't have a direct base price here
    };


    const { error } = await supabaseBrowserClient.from("produtos").update(updateData).eq("id", form.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pizza Meio a Meio atualizada com sucesso" });
      router.push("/admin/pizzas"); // Navigate back to the list page
      router.refresh();
    }
    setSalvando(false);
  }

  if (loading || !form) return (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando dados da Pizza Meio a Meio...</p>
    </div>
  );

  const currentTamanho = form.available_sizes && form.available_sizes.length > 0 ? form.available_sizes[0] : '';

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Editar Pizza Meio a Meio</h1>

      <div className="space-y-2">
        <Label htmlFor="nomePizza">Nome da Base da Pizza</Label>
        <Input id="nomePizza" value={form.nome} onChange={(e) => setForm(prev => prev ? { ...prev, nome: e.target.value } : null)} />
      </div>

      <div className="space-y-2">
        <Label>Imagem</Label>
        {imagemPreview && <Image src={imagemPreview} alt="Prévia" width={150} height={150} className="rounded-md object-cover aspect-square" />}
        <div className="mt-2">
          <Input type="file" onChange={handleImageUpload} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="tamanhoPizza">Tamanho Base</Label>
            <Select
                value={currentTamanho}
                onValueChange={(value) => setForm(prev => prev ? { ...prev, available_sizes: [value] } : null)}
                disabled={salvando}
            >
                <SelectTrigger id="tamanhoPizza">
                    <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pequena">Pequena</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
            </Select>
        </div>
         <div className="space-y-2">
            <Label htmlFor="tipoPizza">Tipo da Pizza (Sabor)</Label>
            <Select
                value={form.tipo_pizza ?? ''}
                onValueChange={(value) => setForm(prev => prev ? { ...prev, tipo_pizza: value as 'salgada' | 'doce' } : null)}
                disabled={salvando}
            >
                <SelectTrigger id="tipoPizza">
                    <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="salgada">Salgada</SelectItem>
                    <SelectItem value="doce">Doce</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>


      <div className="flex gap-6 mt-4">
        <div className="flex items-center space-x-2">
          <Switch id="mostrarNoCardapio" checked={form.mostrar_no_cardapio ?? false} onCheckedChange={(v) => setForm(prev => prev ? { ...prev, mostrar_no_cardapio: v } : null)} />
          <Label htmlFor="mostrarNoCardapio">Mostrar no Cardápio</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="ativo" checked={form.ativo ?? false} onCheckedChange={(v) => setForm(prev => prev ? { ...prev, ativo: v } : null)} />
          <Label htmlFor="ativo">Ativa</Label>
        </div>
      </div>

      <Button onClick={salvar} disabled={salvando || loading} className="mt-6">
        {salvando ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
        Salvar Alterações
      </Button>
    </div>
  );
}
