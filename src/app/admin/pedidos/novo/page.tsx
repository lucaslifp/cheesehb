
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { OrderStatusAdmin, TipoEntrega, BairroEntrega, PaymentMethod, ClienteAdmin } from "@/types";
import { orderStatusAdmin as ALL_STATUSES, paymentMethods as ALL_PAYMENT_METHODS } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft, User, Phone, MapPin, CreditCard, ShoppingBag, Home, ListChecks, MessageSquareText, Loader2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

const manualOrderFormSchema = z.object({
  clienteNome: z.string().min(2, "O nome do cliente deve ter pelo menos 2 caracteres."),
  clienteTelefone: z.string().trim().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato de telefone inválido. Ex: (XX) XXXXX-XXXX"),
  tipoEntrega: z.enum(['retirada', 'entrega'], {
    required_error: "Selecione o tipo de entrega.",
  }),
  endereco: z.string().optional(),
  bairroId: z.string().uuid("Selecione um bairro válido.").nullable().optional(),
  complemento: z.string().optional(),
  itensPedidoTexto: z.string().min(5, "Descreva pelo menos um item para o pedido."),
  subtotalPedido: z.coerce.number({invalid_type_error: "Subtotal inválido."}).min(0, "Subtotal deve ser zero ou positivo."),
  taxaEntrega: z.coerce.number({invalid_type_error: "Taxa de entrega inválida."}).min(0, "Taxa de entrega deve ser zero ou positiva."),
  totalPedido: z.coerce.number().min(0, "Total do pedido deve ser zero ou positivo."),
  formaPagamento: z.enum(ALL_PAYMENT_METHODS, {
    required_error: "Selecione uma forma de pagamento.",
  }),
  statusPedido: z.enum(ALL_STATUSES, {
    required_error: "Selecione um status inicial para o pedido.",
  }),
  observacoesGerais: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.tipoEntrega === 'entrega') {
    if (!data.endereco || data.endereco.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O endereço (Rua, Número) é obrigatório para entrega e deve ter pelo menos 5 caracteres.",
        path: ["endereco"],
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
  const calculatedTotal = (data.subtotalPedido || 0) + (data.taxaEntrega || 0);
  if (Math.abs(calculatedTotal - (data.totalPedido || 0)) > 0.001) { // Usar uma pequena tolerância para floats
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `O total do pedido (R$ ${data.totalPedido.toFixed(2).replace('.',',')}) não corresponde à soma do subtotal (R$ ${data.subtotalPedido.toFixed(2).replace('.',',')}) e da taxa de entrega (R$ ${data.taxaEntrega.toFixed(2).replace('.',',')}). Esperado: R$ ${calculatedTotal.toFixed(2).replace('.',',')}`,
        path: ["totalPedido"],
    });
  }
});

type ManualOrderFormValues = z.infer<typeof manualOrderFormSchema>;

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

const currencyInputToNumber = (input: string): number | undefined => {
  const digits = input.replace(/[^0-9]/g, '');
  if (digits === '') return undefined; // Retorna undefined se estiver vazio para o coerce tratar
  return parseInt(digits, 10) / 100;
};

const numberToCurrencyString = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  // Formata como string, ex: "5,00" ou "123,45"
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


export default function RegistrarPedidoManualPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState<BairroEntrega[]>([]);
  const [isLoadingBairros, setIsLoadingBairros] = useState(true);
  const [listaClientes, setListaClientes] = useState<ClienteAdmin[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);

  const form = useForm<ManualOrderFormValues>({
    resolver: zodResolver(manualOrderFormSchema),
    defaultValues: {
      clienteNome: "",
      clienteTelefone: "",
      tipoEntrega: "retirada",
      endereco: "",
      bairroId: null,
      complemento: "",
      itensPedidoTexto: "",
      subtotalPedido: 0,
      taxaEntrega: 0,
      totalPedido: 0,
      formaPagamento: undefined,
      statusPedido: "Novo",
      observacoesGerais: "",
    },
  });

  useEffect(() => {
    const fetchBairros = async () => {
      setIsLoadingBairros(true);
      try {
        const response = await fetch('/api/admin/bairros-entrega');
        if (!response.ok) {
          let errorDetail = 'Falha ao buscar bairros.';
          // ... (error handling as before)
          throw new Error(errorDetail);
        }
        const data: BairroEntrega[] = await response.json();
        setBairrosDisponiveis(data.filter(b => b.ativo));
      } catch (error) {
        console.error(error);
        toast({ title: "Erro ao Carregar Bairros", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingBairros(false);
      }
    };
    fetchBairros();

    const fetchClientes = async () => {
      setIsLoadingClientes(true);
      try {
        const response = await fetch('/api/admin/clientes');
        if(!response.ok) {
            // ... (error handling as before)
            throw new Error('Falha ao buscar clientes.');
        }
        const data: ClienteAdmin[] = await response.json();
        setListaClientes(data);
      } catch (error) {
        console.error(error);
        toast({ title: "Erro ao Carregar Clientes", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingClientes(false);
      }
    };
    fetchClientes();
  }, []);

  const watchedTipoEntrega = form.watch('tipoEntrega');
  const watchedSubtotal = form.watch('subtotalPedido');
  const watchedTaxaEntrega = form.watch('taxaEntrega');
  const watchedBairroId = form.watch('bairroId');

  useEffect(() => {
    const sub = isNaN(Number(watchedSubtotal)) ? 0 : Number(watchedSubtotal);
    const taxa = isNaN(Number(watchedTaxaEntrega)) ? 0 : Number(watchedTaxaEntrega);
    form.setValue('totalPedido', sub + taxa);
  }, [watchedSubtotal, watchedTaxaEntrega, form]);

  useEffect(() => {
    if (watchedTipoEntrega === 'retirada') {
      form.setValue('taxaEntrega', 0);
      form.setValue('bairroId', null, { shouldValidate: true });
      form.setValue('endereco', '');
      form.setValue('complemento', '');
      form.clearErrors(['endereco', 'bairroId']);
    } else {
        if (watchedBairroId) {
            const selectedBairro = bairrosDisponiveis.find(b => b.id === watchedBairroId);
            // Só auto-preenche taxa se não tiver sido editada manualmente ou se bairro mudou
            // (Para simplificar, vamos deixar que o usuário possa sobrescrever após seleção)
            form.setValue('taxaEntrega', selectedBairro ? selectedBairro.taxa_entrega : 0);
        } else {
            // Se nenhum bairro selecionado e é entrega, a taxa pode ser 0 ou o usuário insere.
            // form.setValue('taxaEntrega', 0); // Ou manter o valor atual se já editado
        }
    }
  }, [watchedTipoEntrega, form, watchedBairroId, bairrosDisponiveis]);


  const onSubmit = async (data: ManualOrderFormValues) => {
    setIsLoading(true);
    
    const payload = {
        ...data,
        bairroId: data.tipoEntrega === 'entrega' ? data.bairroId : null,
        observacoes_itens_texto: data.itensPedidoTexto 
    };

    try {
      const response = await fetch('/api/admin/pedidos/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // ... (error handling as before)
        const errorText = await response.text();
        let processedErrorMessage = `Erro da API (Status: ${response.status}): ${errorText.substring(0, 300)}${errorText.length > 300 ? '...' : ''}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && typeof errorData === 'object') {
            if (errorData.error) processedErrorMessage = `Erro da API: ${errorData.error}`;
            if (errorData.details && errorData.details.fieldErrors) {
                 processedErrorMessage += ` Detalhes: ${Object.entries(errorData.details.fieldErrors).map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`).join('; ')}`;
            } else if (errorData.details) {
                 processedErrorMessage += ` Detalhes: ${JSON.stringify(errorData.details)}`;
            }
          }
        } catch (parseError) { /* Use raw text */ }
        throw new Error(processedErrorMessage);
      }

      toast({
        title: "Pedido Registrado!",
        description: `O pedido manual para ${data.clienteNome} foi registrado com sucesso.`,
      });
      router.push('/admin/pedidos');
      router.refresh();
    } catch (error: any) {
       console.error("Falha detalhada ao registrar pedido manual (frontend catch):", error.message);
       toast({
         title: "Erro ao Registrar Pedido",
         description: `Detalhes: ${error.message}. Verifique o console do navegador para a resposta completa da API, se aplicável.`,
         variant: "destructive",
         duration: 15000,
       });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case "Dinheiro":
        return <User className="mr-2 h-4 w-4" />; 
      case "Cartão de Débito":
      case "Cartão de Crédito":
        return <CreditCard className="mr-2 h-4 w-4" />;
      case "PIX":
        return <Phone className="mr-2 h-4 w-4" />; 
      default:
        return null;
    }
  };

  const handleNomeBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const nomeDigitado = event.target.value.trim();
    if (nomeDigitado && !isLoadingClientes && form.getValues("clienteTelefone") === "") {
      const clienteEncontrado = listaClientes.find(
        (c) => c.nome.toLowerCase() === nomeDigitado.toLowerCase()
      );
      if (clienteEncontrado && clienteEncontrado.telefone) {
        form.setValue("clienteTelefone", formatPhoneNumber(clienteEncontrado.telefone), { shouldValidate: true });
      }
    }
  };

  const handleTelefoneBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const telefoneDigitado = event.target.value.trim();
    if (telefoneDigitado && !isLoadingClientes && form.getValues("clienteNome") === "") {
      const clienteEncontrado = listaClientes.find(
        (c) => c.telefone === telefoneDigitado
      );
      if (clienteEncontrado) {
        form.setValue("clienteNome", clienteEncontrado.nome, { shouldValidate: true });
      }
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Registrar Pedido Manualmente</h1>
        <Link href="/admin/pedidos" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Pedidos
          </Button>
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="clienteNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do cliente" {...field} onBlur={handleNomeBlur} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clienteTelefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Cliente</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="(XX) XXXXX-XXXX" 
                        {...field}
                        onChange={(e) => {
                            const formattedValue = formatPhoneNumber(e.target.value);
                            field.onChange(formattedValue);
                        }}
                        onBlur={handleTelefoneBlur}
                        maxLength={15}
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary" /> Entrega e Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tipoEntrega"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Entrega</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                            field.onChange(value as TipoEntrega);
                        }}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                          <FormControl>
                            <RadioGroupItem value="retirada" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center cursor-pointer w-full">
                            <ShoppingBag className="mr-2 h-4 w-4" /> Retirar no Local
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                          <FormControl>
                            <RadioGroupItem value="entrega" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center cursor-pointer w-full">
                            <Home className="mr-2 h-4 w-4" /> Entrega
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchedTipoEntrega === 'entrega' && (
                <div className="space-y-4 pt-4 border-t mt-4">
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> Endereço (Rua, Número)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Rua das Flores, 123" {...field} />
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
                            const selectedBairro = bairrosDisponiveis.find(b => b.id === value);
                            form.setValue('taxaEntrega', selectedBairro ? selectedBairro.taxa_entrega : 0, {shouldValidate: true});
                          }} 
                          value={field.value || ""} 
                          disabled={isLoadingBairros}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingBairros ? "Carregando bairros..." : "Selecione o bairro para entrega"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingBairros && <SelectItem value="loading" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando...</SelectItem>}
                            {!isLoadingBairros && bairrosDisponiveis.map(bairro => (
                              <SelectItem key={bairro.id} value={bairro.id}>
                                {bairro.nome} (+ R$ {bairro.taxa_entrega.toFixed(2).replace('.', ',')})
                              </SelectItem>
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
                          <Input placeholder="Apto, Bloco, Casa dos Fundos, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" /> Itens do Pedido</CardTitle>
              <CardDescription>
                Descreva os itens do pedido. Ex: "1x Pizza G Calabresa sem cebola, 2x Coca Lata".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="itensPedidoTexto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lista de Itens (Texto Livre)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: 1x Pizza Grande Calabresa (sem cebola)&#10;2x Coca-Cola Lata&#10;1x Hambúrguer X-Tudo (ponto da carne ao ponto)"
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" /> Detalhes Financeiros e Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="subtotalPedido"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subtotal do Pedido (R$)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="text" 
                                        placeholder="0,00" 
                                        value={numberToCurrencyString(field.value)}
                                        onChange={(e) => {
                                            const numericValue = currencyInputToNumber(e.target.value);
                                            field.onChange(numericValue === undefined ? 0 : numericValue);
                                        }}
                                        onBlur={() => { 
                                            form.setValue('subtotalPedido', field.value === undefined ? 0 : field.value, { shouldValidate: true, shouldTouch: true });
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="taxaEntrega"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Taxa de Entrega (R$)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="text" 
                                        placeholder="0,00" 
                                        disabled={watchedTipoEntrega === 'retirada'}
                                        value={numberToCurrencyString(field.value)}
                                        onChange={(e) => {
                                            const numericValue = currencyInputToNumber(e.target.value);
                                            field.onChange(numericValue === undefined ? 0 : numericValue);
                                        }}
                                        onBlur={() => { 
                                            form.setValue('taxaEntrega', field.value === undefined ? 0 : field.value, { shouldValidate: true, shouldTouch: true });
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="totalPedido"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total do Pedido (R$)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="text" 
                                        placeholder="0,00" 
                                        readOnly 
                                        className="font-semibold bg-muted/50"
                                        value={numberToCurrencyString(field.value)}
                                     />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <Separator />
                <FormField
                    control={form.control}
                    name="formaPagamento"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                        >
                            {ALL_PAYMENT_METHODS.map((method) => (
                            <FormItem key={method} className="flex items-center space-x-3 space-y-0 p-2.5 border rounded-md hover:bg-muted/30 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <FormControl>
                                <RadioGroupItem value={method} />
                                </FormControl>
                                <FormLabel className="font-normal flex items-center cursor-pointer w-full">
                                {getPaymentIcon(method as PaymentMethod)} {method}
                                </FormLabel>
                            </FormItem>
                            ))}
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Separator />
                <FormField
                    control={form.control}
                    name="statusPedido"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status Inicial do Pedido</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione o status inicial" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {ALL_STATUSES.filter(s => s !== 'Entregue' && s !== 'Cancelado').map(status => ( 
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><MessageSquareText className="mr-2 h-5 w-5 text-primary" /> Observações Gerais</CardTitle>
               <CardDescription>
                Adicione qualquer observação geral sobre o pedido (ex: troco, urgência, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="observacoesGerais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações gerais para a cozinha ou entrega..." {...field} rows={3}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end gap-2 pt-6 border-t">
            <Link href="/admin/pedidos" passHref>
                <Button type="button" variant="outline" disabled={isLoading || isLoadingBairros || isLoadingClientes}>
                    Cancelar
                </Button>
            </Link>
            <Button type="submit" disabled={isLoading || isLoadingBairros || isLoadingClientes}>
              {(isLoading || isLoadingBairros || isLoadingClientes) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Salvando..." : "Salvar Pedido"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}
    

    