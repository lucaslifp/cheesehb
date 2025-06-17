
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Importar Switch
import type { SaborPizza } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, VenetianMask } from "lucide-react";
import Link from "next/link";

const saborPizzaFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome do sabor deve ter pelo menos 3 caracteres." }),
  descricao: z.string().optional().nullable(),
  preco_grande: z.coerce.number().min(0, { message: "O preço para pizza grande não pode ser negativo." }),
  preco_pequena: z.coerce.number().min(0, { message: "O preço para pizza pequena não pode ser negativo." }),
  categoria_sabor: z.enum(['Salgada', 'Doce'], { required_error: "Selecione a categoria do sabor (Salgada ou Doce)." }),
  ativo: z.boolean().default(true), // Adicionar campo ativo
});

export type SaborPizzaFormValues = z.infer<typeof saborPizzaFormSchema>;

interface SaborPizzaFormProps {
  onSubmit: (data: SaborPizzaFormValues) => void;
  initialData?: Partial<SaborPizzaFormValues>; // Ajustar para SaborPizzaFormValues
  isLoading?: boolean;
  isEditMode?: boolean;
}

export function SaborPizzaForm({ onSubmit, initialData, isLoading, isEditMode = false }: SaborPizzaFormProps) {
  const form = useForm<SaborPizzaFormValues>({
    resolver: zodResolver(saborPizzaFormSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      descricao: initialData?.descricao || "",
      preco_grande: initialData?.preco_grande === undefined ? undefined : Number(initialData.preco_grande),
      preco_pequena: initialData?.preco_pequena === undefined ? undefined : Number(initialData.preco_pequena),
      categoria_sabor: initialData?.categoria_sabor || undefined,
      ativo: initialData?.ativo !== undefined ? initialData.ativo : true, // Definir valor para ativo
    },
  });

  const internalSubmitHandler = (data: SaborPizzaFormValues) => {
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
                <VenetianMask className="mr-2 h-6 w-6 text-primary" />
                {isEditMode ? "Editar Sabor de Pizza" : "Adicionar Novo Sabor de Pizza"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Sabor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Calabresa Especial" {...field} />
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
                    <Textarea placeholder="Ingredientes e detalhes do sabor..." {...field} value={field.value ?? ''} />
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
                    <FormLabel>Preço Pizza Pequena (R$)</FormLabel>
                    <FormControl>
                       <Input
                          type="text"
                          placeholder="Ex: 25,00"
                          value={field.value === undefined ? '' : formatPriceInput(String(field.value), () => {}).split(' ')[1]} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const numericString = val.replace(/R\$\s*/, '').trim().replace(',', '.');
                            if (numericString === "") {
                              field.onChange(undefined);
                            } else if (!isNaN(Number(numericString))) {
                              field.onChange(Number(numericString));
                            }
                          }}
                          onBlur={(e) => { 
                            const val = e.target.value;
                            const numericString = val.replace(/R\$\s*/, '').trim().replace(',', '.');
                            if (numericString !== "" && !isNaN(Number(numericString))) {
                                e.target.value = `R$ ${Number(numericString).toFixed(2).replace('.', ',')}`;
                            } else if (numericString === "") {
                                e.target.value = "";
                            }
                          }}
                        />
                    </FormControl>
                    <FormDescription>Preço do sabor para pizza pequena (inteira).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preco_grande"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Pizza Grande (R$)</FormLabel>
                    <FormControl>
                        <Input
                          type="text"
                          placeholder="Ex: 40,00"
                          value={field.value === undefined ? '' : formatPriceInput(String(field.value), () => {}).split(' ')[1]} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const numericString = val.replace(/R\$\s*/, '').trim().replace(',', '.');
                            if (numericString === "") {
                              field.onChange(undefined);
                            } else if (!isNaN(Number(numericString))) {
                              field.onChange(Number(numericString));
                            }
                          }}
                           onBlur={(e) => { 
                            const val = e.target.value;
                            const numericString = val.replace(/R\$\s*/, '').trim().replace(',', '.');
                            if (numericString !== "" && !isNaN(Number(numericString))) {
                                e.target.value = `R$ ${Number(numericString).toFixed(2).replace('.', ',')}`;
                            } else if (numericString === "") {
                                e.target.value = "";
                            }
                          }}
                        />
                    </FormControl>
                     <FormDescription>Preço do sabor para pizza grande (inteira).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="categoria_sabor"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria do Sabor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione Salgada ou Doce" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Salgada">Salgada</SelectItem>
                        <SelectItem value="Doce">Doce</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col rounded-lg pt-2">
                       <FormLabel>Status do Sabor</FormLabel>
                      <div className="flex flex-row items-center space-x-3 rounded-lg border p-3 shadow-sm h-10">
                         <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormDescription>
                            {field.value ? "Sabor Ativo (visível na loja)" : "Sabor Inativo (oculto na loja)"}
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
          <Link href="/admin/sabores-pizza" passHref>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Cadastrar Sabor")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
