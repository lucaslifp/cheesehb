
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { z } from 'zod';

// Esquema para validação da atualização de detalhes do pedido
const OrderDetailsUpdateSchema = z.object({
  cliente_nome: z.string().min(2, "O nome do cliente deve ter pelo menos 2 caracteres.").optional(),
  cliente_telefone: z.string().trim().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato de telefone inválido.").optional(),
  observacoes_cliente: z.string().optional().nullable(),
  // Adicione outros campos aqui se necessário no futuro, como endereço, etc.
  // Por enquanto, focamos nos campos editáveis no modal.
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;

  if (!orderId) {
    return NextResponse.json({ error: 'ID do pedido é obrigatório.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = OrderDetailsUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    const updatePayload = { ...validation.data, updated_at: new Date().toISOString() };

    if (Object.keys(validation.data).length === 0) {
        return NextResponse.json({ error: 'Nenhum campo fornecido para atualização.' }, { status: 400 });
    }

    const { data: updatedOrder, error } = await supabaseServerClient
      .from('pedidos')
      .update(updatePayload)
      .eq('id', orderId)
      .select() // Retorna todos os campos do pedido atualizado
      .single();

    if (error) {
      console.error(`Erro ao atualizar detalhes do pedido ${orderId}:`, error);
      return NextResponse.json({ error: `Falha ao atualizar detalhes do pedido: ${error.message}` }, { status: 500 });
    }

    if (!updatedOrder) {
      return NextResponse.json({ error: `Pedido com ID ${orderId} não encontrado.` }, { status: 404 });
    }
    
    console.log(`API /admin/pedidos/[id] PUT - Detalhes do pedido ${orderId} atualizados.`);
    return NextResponse.json(updatedOrder);

  } catch (e: any) {
    console.error(`Erro inesperado na API de atualização de detalhes para pedido ${orderId}:`, e);
    return NextResponse.json({ error: 'Erro interno do servidor.', details: e.message }, { status: 500 });
  }
}

// Futuramente, se precisar de um GET para um único pedido detalhado, pode ser adicionado aqui.
// export async function GET(request: NextRequest, { params }: { params: { id: string } }) { ... }
