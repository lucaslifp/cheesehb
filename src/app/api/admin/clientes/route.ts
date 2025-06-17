
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { z } from 'zod';
import type { ClienteAdmin } from '@/types';
import { format, isValid, parseISO } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

const appModeFilePath = path.join(process.cwd(), 'data', 'app-mode.json');

async function getAppMode(): Promise<'supabase' | 'simulation'> {
  try {
    const fileContent = await fs.readFile(appModeFilePath, 'utf-8');
    const config = JSON.parse(fileContent);
    return config.currentMode === 'supabase' ? 'supabase' : 'simulation';
  } catch (error) {
    console.warn('Failed to read app mode for /api/admin/clientes, defaulting to supabase:', error);
    return 'supabase'; 
  }
}

// --- Mock Data for Simulation Mode ---
let mockClientesDB: ClienteAdmin[] = [
  { id: 'mock-cliente-1', nome: 'Arthur Dent (Mock)', telefone: '(11) 91234-5678', dataCadastro: '20/07/2024', totalPedidos: 2, ultimoPedido: '20/07/2024', nao_receber_promocoes: false, fonte: 'manual' },
  { id: 'mock-cliente-2', nome: 'Zaphod Beeblebrox (Mock)', telefone: '(21) 98765-4321', dataCadastro: '15/06/2024', totalPedidos: 1, ultimoPedido: '15/06/2024', nao_receber_promocoes: true, fonte: 'manual' },
  { id: 'mock-cliente-3', nome: 'Trillian Astra (Mock)', telefone: '(31) 99988-7766', dataCadastro: '28/07/2024', totalPedidos: 5, ultimoPedido: '28/07/2024', nao_receber_promocoes: false, fonte: 'manual'},
  { id: 'mock-cliente-4', nome: 'Ford Prefect (Mock)', telefone: '(41) 91122-3344', dataCadastro: '01/08/2024', totalPedidos: 0, ultimoPedido: 'N/A', nao_receber_promocoes: false, fonte: 'manual'},
];
// --- End Mock Data ---

const ClienteCreateSchema = z.object({
  nome: z.string().min(2, "O nome do cliente deve ter pelo menos 2 caracteres."),
  telefone: z.string().trim().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato de telefone inválido. Ex: (XX) XXXXX-XXXX"),
  nao_receber_promocoes: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const mode = await getAppMode();
  
  try {
    const json = await request.json();
    const parsedData = ClienteCreateSchema.safeParse(json);

    if (!parsedData.success) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }
    const { nome, telefone, nao_receber_promocoes } = parsedData.data;

    if (mode === 'simulation') {
      if (mockClientesDB.find(c => c.telefone === telefone)) {
        return NextResponse.json({ error: `Já existe um cliente cadastrado com o telefone ${telefone} (simulado).` }, { status: 409 });
      }
      const newMockId = `mock-cliente-${Date.now()}`;
      const newMockCliente: ClienteAdmin = {
        id: newMockId,
        nome,
        telefone,
        nao_receber_promocoes,
        dataCadastro: new Date().toLocaleDateString('pt-BR'),
        totalPedidos: 0,
        ultimoPedido: 'N/A',
        fonte: 'manual',
      };
      mockClientesDB.push(newMockCliente);
      console.log("API POST /admin/clientes (Simulação) - Cliente adicionado:", newMockCliente.nome);
      return NextResponse.json(newMockCliente, { status: 201 });
    } else { // Supabase mode
      const { data: novoCliente, error } = await supabaseServerClient
        .from('clientes')
        .insert({
          nome,
          telefone,
          nao_receber_promocoes,
          data_cadastro: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente no Supabase:', error);
        if (error.code === '23505') { 
          return NextResponse.json({ error: `Já existe um cliente cadastrado com o telefone ${telefone}.` }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!novoCliente) {
        return NextResponse.json({ error: 'Falha ao criar cliente, nenhum dado retornado.' }, { status: 500 });
      }
      const formattedCliente: ClienteAdmin = {
          id: novoCliente.id,
          nome: novoCliente.nome,
          telefone: novoCliente.telefone,
          nao_receber_promocoes: novoCliente.nao_receber_promocoes,
          dataCadastro: novoCliente.data_cadastro ? format(parseISO(novoCliente.data_cadastro), 'dd/MM/yyyy') : (novoCliente.created_at ? format(parseISO(novoCliente.created_at), 'dd/MM/yyyy') : 'N/A'),
          totalPedidos: 0,
          ultimoPedido: 'N/A',
          fonte: 'manual',
      };
      return NextResponse.json(formattedCliente, { status: 201 });
    }
  } catch (e: any) {
    console.error(`Erro inesperado no POST de clientes (Modo: ${mode}):`, e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function GET() {
  const mode = await getAppMode();

  if (mode === 'simulation') {
    console.log("API GET /admin/clientes (Simulação) - Retornando mockClientesDB");
    return NextResponse.json([...mockClientesDB].sort((a,b) => a.nome.localeCompare(b.nome)));
  } else { // Supabase mode
    try {
      const { data: clientesDB, error } = await supabaseServerClient
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar clientes do Supabase:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const clientesFormatados: ClienteAdmin[] = clientesDB.map(c => ({
        id: c.id,
        nome: c.nome,
        telefone: c.telefone,
        dataCadastro: c.data_cadastro && isValid(parseISO(c.data_cadastro)) ? format(parseISO(c.data_cadastro), 'dd/MM/yyyy') : (c.created_at && isValid(parseISO(c.created_at)) ? format(parseISO(c.created_at), 'dd/MM/yyyy') : 'N/A'),
        nao_receber_promocoes: c.nao_receber_promocoes || false,
        totalPedidos: 0, 
        ultimoPedido: 'N/A', 
        fonte: 'manual', 
      }));
      return NextResponse.json(clientesFormatados);
    } catch (e: any) {
      console.error('Erro inesperado no GET de clientes (Supabase):', e);
      return NextResponse.json({ error: 'Erro interno do servidor ao listar clientes.' }, { status: 500 });
    }
  }
}
