// src/app/admin/personalizar/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { UploadCloud, Save, Loader2 } from "lucide-react";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

type LojaConfig = {
  nome_loja: string;
  endereco_loja: string;
  whatsapp_loja: string;
  instagram_loja: string;
  logo_url: string;
};

export default function AdminPersonalizarPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<LojaConfig>({
    defaultValues: {
      nome_loja: "",
      endereco_loja: "",
      whatsapp_loja: "",
      instagram_loja: "",
      logo_url: "",
    },
  });

  // Carrega dados da loja
  useEffect(() => {
    (async () => {
      const { data, error } = await supabaseBrowserClient
        .from("loja_configuracoes")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();

      if (error) {
        toast({ title: "Erro ao carregar loja" });
        return;
      }

      form.reset({
        nome_loja: data.nome_loja ?? "",
        endereco_loja: data.endereco_loja ?? "",
        whatsapp_loja: data.whatsapp_loja ?? "",
        instagram_loja: data.instagram_loja ?? "",
        logo_url: data.logo_url ?? "",
      });
    })();
  }, [form]);

  // Upload de logomarca
  const onUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const path = "logomarcas/logo.png";
    const { error } = await supabaseBrowserClient.storage
      .from("public-assets")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      toast({ title: "Falha ao enviar imagem" });
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabaseBrowserClient.storage.from("public-assets").getPublicUrl(path);

    form.setValue("logo_url", publicUrl, { shouldDirty: true });
    toast({ title: "Imagem enviada" });
    setUploading(false);
  };

  // Salvar configurações
  const onSubmit = async (values: LojaConfig) => {
    setIsSaving(true);

    const { error } = await supabaseBrowserClient
      .from("loja_configuracoes")
      .update(values)
      .eq("id", "00000000-0000-0000-0000-000000000001");

    setIsSaving(false);

    if (error) return toast({ title: "Erro ao salvar" });

    toast({ title: "Salvo com sucesso" });
    router.refresh();
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Personalizar Aparência da Loja</CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome_loja"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Loja</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Endereço */}
              <FormField
                control={form.control}
                name="endereco_loja"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* WhatsApp */}
              <FormField
                control={form.control}
                name="whatsapp_loja"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instagram */}
              <FormField
                control={form.control}
                name="instagram_loja"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logomarca */}
              <div>
                <Label>Logomarca da Loja</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    onClick={() => document.getElementById("logoUpload")?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" /> Enviar Imagem
                  </Button>

                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={onUploadLogo}
                    className="hidden"
                  />

                  {uploading && <p className="text-sm">Enviando...</p>}
                </div>

                {form.watch("logo_url") && (
                  <Image
                    src={form.watch("logo_url")}
                    alt="Prévia da Logo"
                    width={120}
                    height={120}
                    className="mt-2 rounded-md"
                  />
                )}
              </div>

              {/* Botão Salvar */}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
