
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContactInfo, TipoEntrega, BairroEntrega } from '@/types'; 
import { paymentMethods } from "@/types";
import { User, Phone, MapPin, CreditCard, Banknote, Smartphone, Home, ShoppingBag, MessageSquareText } from "lucide-react";
import { useEffect, useCallback } from "react"; 
import { useCart } from "@/hooks/use-cart"; // Import useCart

const contactFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  phone: z.string().trim().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato de telefone inválido. Ex: (XX) XXXXX-XXXX"),
  tipoEntrega: z.enum(['retirada', 'entrega'], {
    required_error: "Selecione o tipo de entrega.",
  }),
  address: z.string().optional(), 
  bairroId: z.string().nullable().optional(), 
  complemento: z.string().optional(),
  observacoes: z.string().optional(),
  paymentMethod: z.enum(paymentMethods, {
    required_error: "Você precisa selecionar uma forma de pagamento.",
  }),
}).superRefine((data, ctx) => {
  if (data.tipoEntrega === 'entrega') {
    if (!data.address || data.address.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O endereço (Rua, Número) é obrigatório para entrega e deve ter pelo menos 5 caracteres.",
        path: ["address"],
      });
    }
    if (!data.bairroId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A seleção do bairro é obrigatória para entrega.",
        path: ["bairroId"],
      });
    }
  }
});


type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  onSubmit: (data: ContactInfo) => void;
  initialData?: Partial<ContactInfo>;
  isLoading?: boolean;
  onFormChange?: (data: Partial<ContactInfo>) => void; 
}

const formatPhoneNumber = (value: string): string => {
  if (!value) return value;
  const phoneNumber = value.replace(/\D/g, '');
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 3) return `(${phoneNumber}`;
  if (phoneNumberLength < 8) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  if (phoneNumberLength === 10) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
  if (phoneNumberLength === 11) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  if (phoneNumberLength > 11) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  
  return value; 
};


export function ContactForm({ onSubmit, initialData, isLoading, onFormChange }: ContactFormProps) {
  const { bairrosEntrega } = useCart(); // Obter bairros do contexto
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      tipoEntrega: initialData?.tipoEntrega || 'retirada',
      address: initialData?.address || "",
      bairroId: initialData?.bairroId || null,
      complemento: initialData?.complemento || "",
      observacoes: initialData?.observacoes || "",
      paymentMethod: initialData?.paymentMethod,
    },
  });


  const watchedTipoEntrega = form.watch('tipoEntrega');
  const watchedBairroId = form.watch('bairroId');

  useEffect(() => {
    if (onFormChange) {
      onFormChange({ tipoEntrega: watchedTipoEntrega, bairroId: watchedBairroId });
    }
  }, [watchedTipoEntrega, watchedBairroId, onFormChange]);


  const handleSubmit = (data: ContactFormValues) => {
    const dataToSubmit: ContactInfo = {
      name: data.name,
      phone: data.phone,
      tipoEntrega: data.tipoEntrega,
      paymentMethod: data.paymentMethod,
      observacoes: data.observacoes, 
    };
    if (data.tipoEntrega === 'entrega') {
      dataToSubmit.address = data.address;
      dataToSubmit.bairroId = data.bairroId;
      dataToSubmit.complemento = data.complemento;
    } else {
       dataToSubmit.bairroId = null; 
       dataToSubmit.address = undefined;
       dataToSubmit.complemento = undefined;
    }
    onSubmit(dataToSubmit);
  };

  const getPaymentIcon = (method: typeof paymentMethods[number]) => {
    switch (method) {
      case "Dinheiro":
        return <Banknote className="mr-2 h-4 w-4" />;
      case "Cartão de Débito":
      case "Cartão de Crédito":
        return <CreditCard className="mr-2 h-4 w-4" />;
      case "PIX":
        return <Smartphone className="mr-2 h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const bairrosDisponiveis: BairroEntrega[] = useMemo(() => 
    bairrosEntrega.filter(b => b.ativo), 
    [bairrosEntrega]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" />Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu Nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4" />Número de Telefone</FormLabel>
              <FormControl>
                <Input 
                  type="tel" 
                  placeholder="(61) 00000-0000" 
                  {...field}
                  onChange={(e) => {
                    const formattedValue = formatPhoneNumber(e.target.value);
                    field.onChange(formattedValue);
                  }}
                  maxLength={15} 
                />
              </FormControl>
              <FormDescription>Usaremos para entrar em contato sobre seu pedido.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipoEntrega"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base font-semibold flex items-center">
                 Tipo de Entrega
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    const newTipoEntrega = value as TipoEntrega;
                    field.onChange(newTipoEntrega);
                    if (newTipoEntrega === 'retirada') {
                      form.setValue('address', '');
                      form.setValue('bairroId', null, { shouldValidate: true }); 
                      form.setValue('complemento', '');
                      form.clearErrors(['address', 'bairroId']);
                    }
                  }}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="retirada" />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center cursor-pointer w-full">
                      <ShoppingBag className="mr-2 h-4 w-4 text-primary" />
                      Retirar no Local
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="entrega" />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center cursor-pointer w-full">
                       <Home className="mr-2 h-4 w-4 text-primary" />
                      Entrega
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedTipoEntrega === 'entrega' && (
          <div className="space-y-6 p-4 border rounded-md bg-muted/20">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" />Endereço (Rua, Número)</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua das Pizzas, 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bairroId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                        field.onChange(value);
                    }} 
                    value={field.value || ""} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o bairro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bairrosDisponiveis.map(bairro => (
                        <SelectItem key={bairro.id} value={bairro.id}>{bairro.nome} (+ R$ {bairro.taxa_entrega.toFixed(2).replace('.', ',')})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto 101, Bloco B, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MessageSquareText className="mr-2 h-4 w-4" />Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Ponto de referência, pedido sem cebola, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base font-semibold flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-primary" /> Forma de Pagamento
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2"
                >
                  {paymentMethods.map((method) => (
                    <FormItem key={method} className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 transition-colors  has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                      <FormControl>
                        <RadioGroupItem value={method} />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center cursor-pointer w-full">
                        {getPaymentIcon(method)}
                        {method}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? "Processando..." : "Finalizar Pedido"}
        </Button>
      </form>
    </Form>
  );
}
