
import { NextResponse, type NextRequest } from 'next/server';
// import { supabaseServerClient } from '@/lib/supabaseServerClient'; // Changed from supabase
import type { CartItem, ContactInfo, CriarPedidoPayload, PedidoInsert, PedidoItemInsert, UpsoldItem } from '@/types';
import { z } from 'zod';

const CriarPedidoPayloadSchema = z.object({
  contactInfo: z.object({
    name: z.string().min(1, "Nome do cliente é obrigatório."),
    phone: z.string().min(1, "Telefone do cliente é obrigatório."),
    tipoEntrega: z.enum(['retirada', 'entrega']),
    address: z.string().optional(),
    bairroId: z.string().uuid().optional().nullable(),
    complemento: z.string().optional(),
    paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória."),
    observacoes: z.string().optional(),
  }),
  cartItems: z.array(z.any()).min(1, "O carrinho não pode estar vazio."),
  upsoldItem: z.object({
    name: z.string(),
    price: z.number(),
  }).nullable(),
  subtotal: z.number(),
  frete: z.number(),
  totalAmount: z.number(),
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
  return `SIM${result}`; // Add SIM prefix for simulated orders
}

// No need for getUniqueOrderNumber in simulation as we don't check DB
// async function getUniqueOrderNumber(): Promise<string> { ... }


export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CriarPedidoPayload;
    
    const validation = CriarPedidoPayloadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Dados do pedido inválidos.", details: validation.error.flatten() }, { status: 400 });
    }

    const { contactInfo, cartItems, upsoldItem, subtotal, frete, totalAmount } = validation.data;
    const newOrderNumber = generateOrderNumberString(); // Simple generation for simulation
    const simulatedPedidoId = `sim-${Date.now()}`;

    console.log("API /checkout/criar-pedido (Simulada) - Pedido recebido:", {
        contactInfo, cartItems, upsoldItem, subtotal, frete, totalAmount, newOrderNumber, simulatedPedidoId
    });
    
    // Simulate successful order creation
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    return NextResponse.json({ 
        message: "Pedido criado com sucesso (Simulação)!", 
        pedidoId: simulatedPedidoId,
        order_number: newOrderNumber, 
    }, { status: 201 });

  } catch (e: any) {
    console.error("Erro inesperado ao criar pedido (Simulação):", e);
    return NextResponse.json({ error: "Erro interno do servidor (simulado).", details: e.message }, { status: 500 });
  }
}
