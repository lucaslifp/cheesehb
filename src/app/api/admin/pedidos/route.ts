
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { format, parseISO, isValid, parse as parseDateStr, startOfDay, endOfDay } from 'date-fns';
import type { OrderAdmin, OrderStatusAdmin, PedidoDB, PedidoItemDB, BairroEntrega } from '@/types';

export const dynamic = 'force-dynamic'; 

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date'); 

  console.log(`API /admin/pedidos GET - Iniciando busca de pedidos em: ${new Date().toISOString()}. Date param: ${dateParam}`);
  
  try {
    let query = supabaseServerClient
      .from('pedidos')
      .select('*') // Selecionar todos os campos, incluindo o novo 'order_number'
      .order('data_hora_pedido', { ascending: false });

    if (dateParam) {
      const parsedDate = parseDateStr(dateParam, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        const dayStart = startOfDay(parsedDate).toISOString();
        const dayEnd = endOfDay(parsedDate).toISOString();
        console.log(`API /admin/pedidos GET - Filtrando por data: ${dateParam} (De: ${dayStart} Até: ${dayEnd})`);
        query = query.gte('data_hora_pedido', dayStart).lte('data_hora_pedido', dayEnd);
      } else {
        console.warn(`API /admin/pedidos GET - Parâmetro de data inválido: ${dateParam}. Ignorando filtro de data.`);
      }
    } else {
      query = query.limit(100); 
    }

    const { data: rawPedidos, error: pedidosError } = await query;

    if (pedidosError) {
      console.error('API /admin/pedidos GET - Erro ao buscar pedidos:', pedidosError);
      return NextResponse.json({ error: `Erro ao buscar pedidos: ${pedidosError.message}` }, { status: 500 });
    }
    console.log(`API /admin/pedidos GET - Raw pedidos from Supabase (count: ${rawPedidos?.length || 0}):`, rawPedidos?.map(p => p.id));

    if (!rawPedidos || rawPedidos.length === 0) {
      console.log('API /admin/pedidos GET - Nenhum pedido encontrado para os filtros aplicados.');
      return NextResponse.json([]);
    }

    const pedidoIds = rawPedidos.map(p => p.id);

    const { data: todosItensDoPedido, error: itensError } = await supabaseServerClient
      .from('pedido_itens')
      .select('*')
      .in('pedido_id', pedidoIds);

    if (itensError) {
      console.error('API /admin/pedidos GET - Erro ao buscar itens de pedido:', itensError);
      return NextResponse.json({ error: `Erro ao buscar itens de pedido: ${itensError.message}` }, { status: 500 });
    }
    console.log(`API /admin/pedidos GET - Raw itens (count: ${todosItensDoPedido?.length || 0}) for ${pedidoIds.length} orders.`);

    const bairroIds = rawPedidos.map(p => p.endereco_bairro_id).filter(id => id !== null) as string[];
    let bairrosMap = new Map<string, string>();
    if (bairroIds.length > 0) {
        const { data: todosBairros, error: bairrosError } = await supabaseServerClient
        .from('bairros_entrega')
        .select('id, nome')
        .in('id', bairroIds);

        if (bairrosError) {
            console.error('API /admin/pedidos GET - Erro ao buscar bairros (continuando sem):', bairrosError);
        } else if (todosBairros) {
            bairrosMap = new Map(todosBairros.map(b => [b.id, b.nome]));
        }
    }
    console.log('API /admin/pedidos GET - Bairros map size:', bairrosMap.size);

    const itensPorPedidoId = new Map<string, PedidoItemDB[]>();
    todosItensDoPedido?.forEach(item => {
      const items = itensPorPedidoId.get(item.pedido_id) || [];
      items.push(item);
      itensPorPedidoId.set(item.pedido_id, items);
    });

    const pedidosFormatados: OrderAdmin[] = rawPedidos.map((pedido: PedidoDB) => {
      const clienteBairroNome = pedido.endereco_bairro_id ? bairrosMap.get(pedido.endereco_bairro_id) || `ID Bairro: ${pedido.endereco_bairro_id}` : undefined;
      const itensDoPedidoAtual = itensPorPedidoId.get(pedido.id) || [];
      
      let parsedTimestamp = 'Data Indisponível';
      if (pedido.data_hora_pedido) {
        try {
          const dateObj = parseISO(pedido.data_hora_pedido);
          if (isValid(dateObj)) {
            parsedTimestamp = format(dateObj, 'dd/MM/yyyy, HH:mm:ss');
          } else {
            console.warn(`API /admin/pedidos GET - Timestamp inválido "${pedido.data_hora_pedido}" para pedido ${pedido.id}`);
          }
        } catch (e) {
          console.warn(`API /admin/pedidos GET - Falha ao parsear data_hora_pedido "${pedido.data_hora_pedido}" para pedido ${pedido.id}:`, e);
        }
      }

      return {
        id: pedido.id,
        order_number: String(pedido.order_number || 'N/P'), // Usar novo campo
        timestamp: parsedTimestamp,
        status: (pedido.status_pedido || 'Status Desconhecido') as OrderStatusAdmin,
        cliente: {
          nome: pedido.cliente_nome || 'Nome Indisponível',
          telefone: pedido.cliente_telefone || 'Telefone Indisponível',
          endereco: pedido.endereco_rua_numero || undefined,
          bairro: clienteBairroNome,
          complemento: pedido.endereco_complemento || undefined,
          observacoes: pedido.observacoes_cliente || undefined,
        },
        itens: itensDoPedidoAtual.map((item: PedidoItemDB) => ({
          nomeProduto: item.nome_produto_no_pedido || 'Item Desconhecido',
          quantidade: item.quantidade || 0,
          precoUnitario: item.preco_unitario_no_pedido || 0,
          precoTotalItem: item.preco_total_item_no_pedido || 0,
          sabores: item.sabor1_id ? `Sabores: ${item.sabor1_id}${item.sabor2_id ? ' / ' + item.sabor2_id : ''}` : undefined,
          borda: item.borda_id ? `Borda: ${item.borda_id}` : undefined, 
          adicionais: typeof item.adicionais_cobertura_selecionados === 'string' 
                        ? JSON.parse(item.adicionais_cobertura_selecionados) 
                        : item.adicionais_cobertura_selecionados as any[] || undefined,
          opcionais: typeof item.opcionais_selecionados_item === 'string' 
                        ? JSON.parse(item.opcionais_selecionados_item) 
                        : item.opcionais_selecionados_item as any[] || undefined,
          observacoesItem: item.observacoes_item || undefined,
        })),
        subtotal: pedido.subtotal_pedido || 0,
        taxaEntrega: pedido.taxa_entrega_pedido || 0,
        total: pedido.total_pedido || 0,
        formaPagamento: pedido.forma_pagamento || 'Não especificado',
        upsell: pedido.upsell_sugerido_nome ? { nome: pedido.upsell_sugerido_nome, preco: pedido.upsell_sugerido_preco || 0 } : undefined,
      };
    });
    console.log(`API /admin/pedidos GET - Pedidos formatados (count: ${pedidosFormatados.length}). Primeiro pedido ID:`, pedidosFormatados[0]?.id);
    return NextResponse.json(pedidosFormatados);

  } catch (e: any) {
    console.error('API /admin/pedidos GET - Erro inesperado no handler:', e);
    return NextResponse.json({ error: `Erro interno do servidor no GET /api/admin/pedidos: ${e.message || 'Desconhecido'}` }, { status: 500 });
  }
}
