
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { z } from 'zod';
import type { ClienteAdmin } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

const appModeFilePath = path.join(process.cwd(), 'data', 'app-mode.json');

async function getAppMode(): Promise<'supabase' | 'simulation'> {
  try {
    const fileContent = await fs.readFile(appModeFilePath, 'utf-8');
    const config = JSON.parse(fileContent);
    return config.currentMode === 'supabase' ? 'supabase' : 'simulation';
  } catch (error) {
    console.warn('Failed to read app mode for /api/admin/clientes/[id], defaulting to supabase:', error);
    return 'supabase';
  }
}

// --- Mock Data for Simulation Mode (Referência, mas não é usado para GET por ID diretamente aqui) ---
// A lista principal de mockClientesDB está em /api/admin/clientes/route.ts
// Para PUT e DELETE, vamos assumir que o mockClientesDB é acessível ou manipulamos uma cópia.
// Para simplificação, o mockClientesDB principal será importado se precisarmos (não é ideal, mas para simulação rápida)
// No entanto, como não podemos importar diretamente de outra rota API,
// vamos apenas simular que o cliente é encontrado ou não.
let mockClientesDB_ref: ClienteAdmin[] = [ // Esta é uma cópia local para referência
  { id: 'mock-cliente-1', nome: 'Arthur Dent (Mock)', telefone: '(11) 91234-5678', dataCadastro: '20/07/2024', totalPedidos: 2, ultimoPedido: '20/07/2024', nao_receber_promocoes: false, fonte: 'manual' },
  { id: 'mock-cliente-2', nome: 'Zaphod Beeblebrox (Mock)', telefone: '(21) 98765-4321', dataCadastro: '15/06/2024', totalPedidos: 1, ultimoPedido: '15/06/2024', nao_receber_promocoes: true, fonte: 'manual' },
];
// --- End Mock Data ---


const ClienteUpdateSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").optional(),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato de telefone inválido.").optional(),
  nao_receber_promocoes: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const mode = await getAppMode();
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
  }

  if (mode === 'simulation') {
    // AVISO: O mockClientesDB_ref aqui é uma cópia para referência e não será atualizado por POSTs na outra rota.
    // O GET individual em simulação pode não refletir adições/edições feitas via POST/PUT na outra rota
    // sem uma gestão de estado compartilhado mais complexa para os mocks.
    const cliente = mockClientesDB_ref.find(c => c.id === id);
    if (!cliente) {
      return NextResponse.json({ error: `Cliente com ID ${id} não encontrado (simulado).` }, { status: 404 });
    }
    console.log(`API GET /admin/clientes/${id} (Simulação) - Retornando cliente mockado.`);
    return NextResponse.json(cliente);
  } else { // Supabase mode
     if (!id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
        return NextResponse.json({ error: 'ID do cliente inválido para Supabase. Deve ser um UUID.' }, { status: 400 });
    }
    const { data: cliente, error } = await supabaseServerClient
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erro ao buscar cliente ${id} no Supabase:`, error);
      if (error.code === 'PGRST116') {
          return NextResponse.json({ error: `Cliente com ID ${id} não encontrado.` }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!cliente) {
      return NextResponse.json({ error: `Cliente com ID ${id} não encontrado.` }, { status: 404 });
    }
    const formattedCliente: ClienteAdmin = {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        nao_receber_promocoes: cliente.nao_receber_promocoes,
        dataCadastro: cliente.data_cadastro ? format(parseISO(cliente.data_cadastro), 'dd/MM/yyyy') : (cliente.created_at ? format(parseISO(cliente.created_at), 'dd/MM/yyyy') : 'N/A'),
        totalPedidos: 0,
        ultimoPedido: 'N/A',
        fonte: 'manual',
    };
    return NextResponse.json(formattedCliente);
  }
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const mode = await getAppMode();
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
  }
  
  try {
    const json = await request.json();
    const parsedData = ClienteUpdateSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }
    
    if (Object.keys(parsedData.data).length === 0) {
        return NextResponse.json({ error: 'Nenhum dado fornecido para atualização.' }, { status: 400 });
    }

    if (mode === 'simulation') {
      const clientIndex = mockClientesDB_ref.findIndex(c => c.id === id);
      if (clientIndex === -1) {
        return NextResponse.json({ error: `Cliente com ID ${id} não encontrado para atualização (simulado).` }, { status: 404 });
      }
      if (parsedData.data.telefone && mockClientesDB_ref.some(c => c.telefone === parsedData.data.telefone && c.id !== id)) {
        return NextResponse.json({ error: `Já existe outro cliente cadastrado com o telefone ${parsedData.data.telefone} (simulado).` }, { status: 409 });
      }
      const updatedMockClient = { ...mockClientesDB_ref[clientIndex], ...parsedData.data };
      mockClientesDB_ref[clientIndex] = updatedMockClient;
      console.log(`API PUT /admin/clientes/${id} (Simulação) - Cliente atualizado.`);
      return NextResponse.json(updatedMockClient);
    } else { // Supabase mode
        if (!id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
            return NextResponse.json({ error: 'ID do cliente inválido para Supabase. Deve ser um UUID.' }, { status: 400 });
        }
      const updatePayload = { ...parsedData.data, updated_at: new Date().toISOString() };
      const { data: updatedCliente, error } = await supabaseServerClient
        .from('clientes')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Erro ao atualizar cliente ${id} no Supabase:`, error);
        if (error.code === '23505' && error.message.includes('clientes_telefone_key')) {
          return NextResponse.json({ error: `Já existe outro cliente cadastrado com o telefone fornecido.` }, { status: 409 });
        }
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: `Cliente com ID ${id} não encontrado.` }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!updatedCliente) {
        return NextResponse.json({ error: `Cliente com ID ${id} não encontrado.` }, { status: 404 });
      }
      const formattedCliente: ClienteAdmin = {
        id: updatedCliente.id,
        nome: updatedCliente.nome,
        telefone: updatedCliente.telefone,
        nao_receber_promocoes: updatedCliente.nao_receber_promocoes,
        dataCadastro: updatedCliente.data_cadastro ? format(parseISO(updatedCliente.data_cadastro), 'dd/MM/yyyy') : (updatedCliente.created_at ? format(parseISO(updatedCliente.created_at), 'dd/MM/yyyy') : 'N/A'),
        totalPedidos: 0,
        ultimoPedido: 'N/A',
        fonte: 'manual',
      };
      return NextResponse.json(formattedCliente);
    }
  } catch (e: any) {
    console.error(`Erro inesperado no PUT de cliente ${id} (Modo: ${mode}):`, e);
    return NextResponse.json({ error: `Erro interno do servidor ao atualizar cliente: ${e.message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const mode = await getAppMode();
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
  }

  if (mode === 'simulation') {
    const initialLength = mockClientesDB_ref.length;
    mockClientesDB_ref = mockClientesDB_ref.filter(c => c.id !== id);
    if (mockClientesDB_ref.length === initialLength) {
      return NextResponse.json({ error: `Cliente com ID ${id} não encontrado para exclusão (simulado).` }, { status: 404 });
    }
    console.log(`API DELETE /admin/clientes/${id} (Simulação) - Cliente excluído.`);
    return NextResponse.json({ message: `Cliente ${id} excluído com sucesso (simulado).` }, { status: 200 });
  } else { // Supabase mode
    if (!id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
        return NextResponse.json({ error: 'ID do cliente inválido para Supabase. Deve ser um UUID.' }, { status: 400 });
    }
    try {
      const { data: existingCliente, error: fetchError } = await supabaseServerClient
        .from('clientes')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error(`Erro ao verificar cliente ${id} antes de deletar:`, fetchError);
        return NextResponse.json({ error: `Erro ao verificar cliente: ${fetchError.message}` }, { status: 500 });
      }
      if (!existingCliente) {
        return NextResponse.json({ error: `Cliente com ID ${id} não encontrado.` }, { status: 404 });
      }

      const { error: deleteError } = await supabaseServerClient
        .from('clientes')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`Erro ao deletar cliente ${id} no Supabase:`, deleteError);
        if (deleteError.code === '23503') { 
          return NextResponse.json({ error: 'Não é possível excluir este cliente pois ele está referenciado em outros registros.' }, { status: 409 });
        }
        return NextResponse.json({ error: `Erro ao deletar cliente: ${deleteError.message}` }, { status: 500 });
      }
      return NextResponse.json({ message: `Cliente ${id} excluído com sucesso.` }, { status: 200 });
    } catch (e: any) { 
      console.error(`Erro inesperado no DELETE de cliente ${id} (Supabase):`, e);
      return NextResponse.json({ error: `Erro interno do servidor ao excluir cliente: ${e.message}` }, { status: 500 });
    }
  }
}
