
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { z } from 'zod';
import type { PedidoInsert, OrderStatusAdmin, TipoEntrega, PaymentMethod } from '@/types';
import { orderStatusAdmin as ALL_STATUSES, paymentMethods as ALL_PAYMENT_METHODS } from "@/types";


const ManualOrderApiSchema = z.object({
  clienteNome: z.string().min(2, "O nome do cliente deve ter pelo menos 2 caracteres."),
  clienteTelefone: z.string().trim().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato de telefone inválido."),
  tipoEntrega: z.enum(['retirada', 'entrega']),
  endereco: z.string().optional(),
  bairroId: z.string().uuid("Selecione um bairro válido.").nullable().optional(),
  complemento: z.string().optional(),
  observacoes_itens_texto: z.string().min(5, "Descreva pelo menos um item para o pedido."),
  subtotalPedido: z.coerce.number({invalid_type_error: "Subtotal inválido."}).min(0, "Subtotal deve ser zero ou positivo."),
  taxaEntrega: z.coerce.number({invalid_type_error: "Taxa de entrega inválida."}).min(0, "Taxa de entrega deve ser zero ou positiva."),
  totalPedido: z.coerce.number().min(0, "Total do pedido deve ser zero ou positivo."),
  formaPagamento: z.enum(ALL_PAYMENT_METHODS, {required_error: "Forma de pagamento é obrigatória."}),
  statusPedido: z.enum(ALL_STATUSES, {required_error: "Status do pedido é obrigatório."}),
  observacoesGerais: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.tipoEntrega === 'entrega') {
    if (!data.endereco || data.endereco.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O endereço (Rua, Número) é obrigatório para entrega.",
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

function generateOrderNumberString(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let result = '';
  for (let i = 0; i < 2; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 5; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return result;
}

async function getUniqueOrderNumber(): Promise<string> {
  let orderNumber;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    orderNumber = generateOrderNumberString();
    const { data, error } = await supabaseServerClient
      .from('pedidos')
      .select('order_number')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar unicidade do order_number:', error);
      throw error; 
    }
    if (!data) {
      isUnique = true;
    } else {
      console.warn(`Order number ${orderNumber} já existe. Tentando novamente...`);
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Falha ao gerar um order_number único após várias tentativas.');
  }
  return orderNumber!;
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("API /admin/pedidos/manual POST - Received body:", body);
    const validation = ManualOrderApiSchema.safeParse(body);

    if (!validation.success) {
      console.error("API /admin/pedidos/manual POST - Validation failed:", validation.error.flatten());
      return NextResponse.json({ error: "Dados do pedido manual inválidos.", details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;
    const newOrderNumber = await getUniqueOrderNumber();

    const pedidoToInsert: PedidoInsert = {
      order_number: newOrderNumber,
      cliente_nome: data.clienteNome,
      cliente_telefone: data.clienteTelefone,
      tipo_entrega: data.tipoEntrega as TipoEntrega,
      endereco_rua_numero: data.tipoEntrega === 'entrega' ? data.endereco : null,
      endereco_bairro_id: data.tipoEntrega === 'entrega' ? data.bairroId : null,
      endereco_complemento: data.tipoEntrega === 'entrega' ? data.complemento : null,
      observacoes_cliente: data.observacoesGerais,
      forma_pagamento: data.formaPagamento as PaymentMethod,
      subtotal_pedido: data.subtotalPedido,
      taxa_entrega_pedido: data.taxaEntrega,
      total_pedido: data.totalPedido,
      status_pedido: data.statusPedido as OrderStatusAdmin,
      data_hora_pedido: new Date().toISOString(),
      observacoes_itens_texto: data.observacoes_itens_texto, 
    };
    
    console.log("API /admin/pedidos/manual POST - Payload to insert:", pedidoToInsert);

    const { data: novoPedido, error: pedidoError } = await supabaseServerClient
      .from('pedidos')
      .insert(pedidoToInsert)
      .select() 
      .single();

    if (pedidoError || !novoPedido) {
      console.error("Error inserting manual order (Supabase):", pedidoError);
      let errorMessage = "Falha ao salvar o pedido manual.";
      if (pedidoError?.message.includes('violates foreign key constraint "pedidos_endereco_bairro_id_fkey"')) {
        errorMessage = "Bairro selecionado para entrega é inválido ou não existe mais.";
      } else if (pedidoError?.message.includes('violates unique constraint') && pedidoError?.message.includes('order_number')) {
        errorMessage = "Conflito ao gerar número do pedido. Tente novamente.";
      }
      return NextResponse.json({ error: errorMessage, details: pedidoError?.message }, { status: 500 });
    }
    
    console.log("API /admin/pedidos/manual POST - Order created successfully:", novoPedido);

    return NextResponse.json({
      message: "Pedido manual registrado com sucesso!",
      pedidoId: novoPedido.id,
      order_number: novoPedido.order_number, 
    }, { status: 201 });

  } catch (e: any) {
    console.error("Unexpected error in POST /admin/pedidos/manual:", e);
    return NextResponse.json({ error: "Erro interno do servidor.", details: e.message }, { status: 500 });
  }
}
