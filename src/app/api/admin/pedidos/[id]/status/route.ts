
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { z } from 'zod';
import { orderStatusAdmin as ALL_STATUSES, type OrderStatusAdmin } from '@/types';

const UpdateOrderStatusSchema = z.object({
  status: z.enum(ALL_STATUSES, {
    required_error: "O novo status é obrigatório.",
    invalid_type_error: "Status fornecido é inválido.",
  }),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;

  if (!orderId) {
    return NextResponse.json({ error: 'ID do pedido é obrigatório.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = UpdateOrderStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    const { status: newStatus } = validation.data;

    const { data: updatedOrder, error } = await supabaseServerClient
      .from('pedidos')
      .update({ status_pedido: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select() // Selecionar todos os campos, incluindo 'order_number'
      .single();

    if (error) {
      console.error(`Erro ao atualizar status do pedido ${orderId} para ${newStatus}:`, error);
      return NextResponse.json({ error: `Falha ao atualizar status: ${error.message}` }, { status: 500 });
    }

    if (!updatedOrder) {
      return NextResponse.json({ error: `Pedido com ID ${orderId} não encontrado.` }, { status: 404 });
    }

    console.log(`API /admin/pedidos/[id]/status PUT - Status do pedido ${updatedOrder.order_number} atualizado para ${newStatus}`);
    return NextResponse.json(updatedOrder);

  } catch (e: any) {
    console.error(`Erro inesperado na API de atualização de status para pedido ${orderId}:`, e);
    return NextResponse.json({ error: 'Erro interno do servidor.', details: e.message }, { status: 500 });
  }
}
