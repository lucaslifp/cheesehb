
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, Loader2 } from "lucide-react";
import Link from "next/link";

const bairroEntregaFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome do bairro deve ter pelo menos 3 caracteres." }),
  taxa_entrega: z.coerce.number({invalid_type_error: "Taxa de entrega deve ser um número."}).min(0, { message: "A taxa de entrega não pode ser negativa." }).optional().nullable(),
  tempo_estimado_entrega_minutos: z.coerce.number().int().positive("O tempo estimado deve ser um número inteiro positivo.").optional().nullable(),
  ativo: z.boolean().default(true),
});

export type BairroEntregaFormValues = z.infer<typeof bairroEntregaFormSchema>;

interface BairroEntregaFormProps {
  onSubmit: (data: BairroEntregaFormValues) => void;
  initialData?: Partial<BairroEntregaFormValues>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

// Function to convert a string of digits (e.g., "12345") to a currency number (e.g., 123.45)
const parseDigitsToCurrencyNumber = (digits: string): number | undefined => {
  if (!digits || !/^\d+$/.test(digits)) { // Ensure it's only digits and not empty
    return undefined;
  }
  const num = parseInt(digits, 10);
  if (isNaN(num)) {
    return undefined;
  }
  // Assume the input digits represent the value in cents
  // e.g., user types 12345 -> means 123.45
  // if user types 6000 -> means 60.00
  return parseFloat((num / 100).toFixed(2));
};

// Function to format a number to a Brazilian currency string for display
const formatNumberToCurrencyDisplay = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return ''; // Return empty for placeholder or if RHF value is null/undefined
  }
  return `R$ ${Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};


export function BairroEntregaForm({ onSubmit, initialData, isLoading, isEditMode = false }: BairroEntregaFormProps) {
  const form = useForm<BairroEntregaFormValues>({
    resolver: zodResolver(bairroEntregaFormSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      taxa_entrega: initialData?.taxa_entrega === undefined || initialData.taxa_entrega === null ? null : Number(initialData.taxa_entrega),
      tempo_estimado_entrega_minutos: initialData?.tempo_estimado_entrega_minutos === undefined ? undefined : (initialData.tempo_estimado_entrega_minutos === null ? null : Number(initialData.tempo_estimado_entrega_minutos)),
      ativo: initialData?.ativo !== undefined ? initialData.ativo : true,
    },
  });

  const internalSubmitHandler = (data: BairroEntregaFormValues) => {
    const dataToSubmit = {
      ...data,
      taxa_entrega: data.taxa_entrega === null || data.taxa_entrega === undefined ? 0 : data.taxa_entrega,
    };
    onSubmit(dataToSubmit);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(internalSubmitHandler)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <Truck className="mr-2 h-6 w-6 text-primary" />
                {isEditMode ? "Editar Bairro/Área de Entrega" : "Adicionar Novo Bairro/Área"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Bairro/Área</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Centro, Setor Sul, Retirada na Loja" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxa_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Entrega (R$)</FormLabel>
                  <FormControl>
                     <Input
                        type="text" // Use text to control the formatting
                        placeholder="R$ 0,00"
                        {...field} // Spread field to include ref, name, onBlur (if needed)
                        value={formatNumberToCurrencyDisplay(field.value as number | undefined | null)}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          const digits = inputValue.replace(/\D/g, ''); // Extract only digits

                          if (digits === "") {
                            field.onChange(null); // Set to null if input is empty after stripping non-digits
                          } else {
                            const numericValue = parseDigitsToCurrencyNumber(digits);
                            field.onChange(numericValue === undefined ? null : numericValue);
                          }
                        }}
                      />
                  </FormControl>
                  <FormDescription>Digite apenas os números (ex: 6000 para R$ 60,00 ou 15050 para R$ 150,50).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tempo_estimado_entrega_minutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo Estimado de Entrega (Minutos, Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 30"
                      {...field}
                      value={field.value === null || field.value === undefined || isNaN(Number(field.value)) ? '' : String(field.value)}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '') {
                            field.onChange(null);
                        } else {
                            const parsedInt = parseInt(val, 10);
                            field.onChange(isNaN(parsedInt) ? null : parsedInt);
                        }
                      }}
                    />
                  </FormControl>
                   <FormDescription>Tempo médio em minutos que leva para entregar neste bairro.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-col rounded-lg pt-2">
                  <FormLabel>Status do Bairro/Área</FormLabel>
                  <div className="flex flex-row items-center space-x-3 rounded-lg border p-3 shadow-sm h-10">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value ? "Ativo (disponível para seleção)" : "Inativo (oculto para seleção)"}
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
          <Link href="/admin/bairros-e-frete" passHref>
            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Cadastrar Bairro/Área")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
