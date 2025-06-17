
import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabaseServerClient'; // Supabase import removed for simulation

export async function GET() {
  try {
    // console.log('API /admin/pedidos/contagem-status GET (Simulada) - Retornando array vazio.');
    // For simulation, return an empty array as 'pedidos' table might not be ready.
    return NextResponse.json([]);

  } catch (e: any) {
    console.error('Erro inesperado no GET de /api/admin/pedidos/contagem-status (Simulada):', e);
    return NextResponse.json({ error: `Erro interno do servidor na API de contagem (Simulada): ${e.message || 'Desconhecido'}` }, { status: 500 });
  }
}

