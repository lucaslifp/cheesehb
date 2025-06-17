
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CircleDot, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Borda } from '@/types'; // Borda type expects preco_pequena/grande

const bordaPizzaFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome da borda deve ter pelo menos 3 caracteres." }),
  descricao: z.string().optional().nullable(),
  preco_pequena: z.coerce.number().min(0, { message: "O preço para pizza pequena não pode ser negativo." }),
  preco_grande: z.coerce.number().min(0, { message: "O preço para pizza grande não pode ser negativo." }),
  ativo: z.boolean().default(true),
});

export type BordaPizzaFormValues = z.infer<typeof bordaPizzaFormSchema>;

interface BordaPizzaFormProps {
  onSubmit: (data: BordaPizzaFormValues) => void;
  initialData?: Partial<Borda>; 
  isLoading?: boolean;
  isEditMode?: boolean;
}

export function BordaPizzaForm({ onSubmit, initialData, isLoading, isEditMode = false }: BordaPizzaFormProps) {
  const form = useForm<BordaPizzaFormValues>({
    resolver: zodResolver(bordaPizzaFormSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      descricao: initialData?.descricao || "",
      // Ensure these are numbers for the form, initialData from API should have them directly
      preco_pequena: initialData?.preco_pequena === undefined ? undefined : Number(initialData.preco_pequena),
      preco_grande: initialData?.preco_grande === undefined ? undefined : Number(initialData.preco_grande),
      ativo: initialData?.ativo !== undefined ? initialData.ativo : true,
    },
  });

  const internalSubmitHandler = (data: BordaPizzaFormValues) => {
    onSubmit(data);
  };
  
  const formatPriceInput = (value: string | number | undefined, fieldChange: (value: string | undefined) => void) => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === "")) {
      fieldChange(undefined);
      return '';
    }
    const numericString = String(value).replace(/R\$\s*/, '').trim().replace(',', '.');
    if (numericString === "" || isNaN(Number(numericString))) {
      fieldChange(undefined);
      return '';
    }
    fieldChange(numericString); 
    return `R$ ${Number(numericString).toFixed(2).replace('.', ',')}`;
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(internalSubmitHandler)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <CircleDot className="mr-2 h-6 w-6 text-primary" />
                {isEditMode ? "Editar Opção de Borda" : "Adicionar Nova Opção de Borda"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Borda</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Catupiry Original" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes sobre a borda..." {...field} value={field.value ?? ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="preco_pequena"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Preço para Pizza Pequena (R$)</FormLabel>
                    <FormControl>
                        <Input
                            type="text"
                            placeholder="Ex: 5,00"
                            value={field.value === undefined ? '' : formatPriceInput(String(field.value), () => {}).split(' ')[1]} 
                            onChange={(e) => {
                                const val = e.target.value;
                                const numericString = val.replace(/R\$\s*/, '').trim().replace(',', '.');
                                if (numericString === "") field.onChange(undefined);
                                else if (!isNaN(Number(numericString))) field.onChange(Number(numericString));
                            }}
                            onBlur={(e) => { 
                                const val = e.target.value;
                                const numericString = val.replace(/R\$\s*/, '').trim().replace(',', '.');
                                if (numericString !== "" && !isNaN(Number(numericString))) e.target.value = `R$ ${Number(numericString).toFixed(2).replace('.', ',')}`;
                                else if (numericString === "") e.target.value = "";
                            }}
                            disabled={isLoading}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="preco_grande"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Preço para Pizza Grande (R$)</FormLabel>
                    <FormControl>
                        <Input
                            type="text"
                            placeholder="Ex: 8,00"
                            value={field.value === undefined ? '' : formatPriceInput(String(field.value), () => {}).split(' ')[1]} 
                            onChange={(e) => {
                                const val = e.target.value;
                                const numericString = val.replace(/R\$\s*/, '').trim().replace(',', '.');
                                if (numericString === "") field.onChange(undefined);
                                else if (!isNaN(Number(numericString))) field.onChange(Number(numericString));
                            }}
                            onBlur={(e) => { 
                                const val = e.target.value;
                                const numericString = val.replace(/R\$\s*/, '').trim().replace(',', '.');
                                if (numericString !== "" && !isNaN(Number(numericString))) e.target.value = `R$ ${Number(numericString).toFixed(2).replace('.', ',')}`;
                                else if (numericString === "") e.target.value = "";
                            }}
                            disabled={isLoading}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-col rounded-lg pt-2">
                  <FormLabel>Status da Borda</FormLabel>
                  <div className="flex flex-row items-center space-x-3 rounded-lg border p-3 shadow-sm h-10">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value ? "Borda Ativa (visível na loja)" : "Borda Inativa (oculta na loja)"}
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
          <Link href="/admin/bordas-pizza" passHref>
            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Cadastrar Borda")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

