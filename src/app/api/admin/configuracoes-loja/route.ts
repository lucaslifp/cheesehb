
// This API route exclusively uses Supabase for all shop configuration settings.
// It does not use any simulation mode or mock data for persistence.
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import type { LojaConfiguracao, HorarioDia, ShopOverrideStatus } from '@/types';
import type { Database } from '@/types/supabase';
import { z } from 'zod';
import { SHOP_OPERATING_HOURS as DEFAULT_FALLBACK_HOURS_CONST, SHOP_FORCED_MANUALLY_CLOSED_MESSAGE } from '@/lib/shop-config'; // Renamed for clarity

// Default config ID for the single settings row
const CONFIG_ID = '00000000-0000-0000-0000-000000000001';

// Helper function to convert default shop hours to HorarioDia[]
const DIAS_SEMANA_MAP_HORARIOS_DB: { index: number; nome: string }[] = [
  { index: 0, nome: 'Domingo' }, { index: 1, nome: 'Segunda-feira' },
  { index: 2, nome: 'Terça-feira' }, { index: 3, nome: 'Quarta-feira' },
  { index: 4, nome: 'Quinta-feira' }, { index: 5, nome: 'Sexta-feira' },
  { index: 6, nome: 'Sábado' },
];

function convertShopHoursToHorarioDiaArray(shopHours: typeof DEFAULT_FALLBACK_HOURS_CONST): HorarioDia[] {
  return DIAS_SEMANA_MAP_HORARIOS_DB.map(day => {
    const hours = shopHours[day.index as keyof typeof DEFAULT_FALLBACK_HOURS_CONST];
    return {
      diaIndex: day.index,
      nomeDia: day.nome,
      aberto: !!hours,
      abreAs: hours?.open || '00:00',
      fechaAs: hours?.close || '00:00',
    };
  });
}
const defaultHorariosFromShopConfigForDb = convertShopHoursToHorarioDiaArray(DEFAULT_FALLBACK_HOURS_CONST);


const DefaultLojaConfig: Omit<LojaConfiguracao, 'id' | 'created_at' | 'updated_at'> = {
  nome_loja: 'Sua Pizzaria Padrão',
  endereco_loja: 'Endereço Padrão, 123',
  whatsapp_loja: '(00) 00000-0000',
  instagram_loja: 'https://instagram.com/seu_perfil_padrao',
  logo_url: 'https://placehold.co/200x100.png?text=SuaLogoPadrao',
  horarios_funcionamento: defaultHorariosFromShopConfigForDb,
  override_status: 'automatico',
  mensagem_loja_fechada_personalizada: null,
};

const LojaConfiguracaoUpdateSchema = z.object({
  nome_loja: z.string().min(1, "Nome da loja é obrigatório.").optional().nullable(),
  endereco_loja: z.string().optional().nullable(),
  whatsapp_loja: z.string().optional().nullable(),
  instagram_loja: z.string().url("URL do Instagram inválida.").optional().nullable(),
  logo_url: z.string().url("URL da logo inválida.").optional().nullable(),
  horarios_funcionamento: z.array(z.object({
    diaIndex: z.number().min(0).max(6),
    nomeDia: z.string(),
    aberto: z.boolean(),
    abreAs: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    fechaAs: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  })).optional().nullable(),
  override_status: z.enum(['automatico', 'forcar_aberto', 'forcar_fechado']).optional().nullable(),
  mensagem_loja_fechada_personalizada: z.string().optional().nullable(),
});


async function getFullConfigFromDb(): Promise<LojaConfiguracao> {
  console.log("API /admin/configuracoes-loja: Fetching full config from Supabase for ID:", CONFIG_ID);
  const { data, error } = await supabaseServerClient
    .from('loja_configuracoes')
    .select('*')
    .eq('id', CONFIG_ID)
    .maybeSingle();

  if (error) {
    console.error("API /admin/configuracoes-loja GET - Error fetching from Supabase:", error);
    // Attempt to insert default if select fails badly (not just not found)
    // This is a bit aggressive, but for ensuring a config row exists.
    const defaultDataForDb = {
      id: CONFIG_ID,
      ...DefaultLojaConfig,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
     try {
        await supabaseServerClient.from('loja_configuracoes').insert(defaultDataForDb).select().single();
        console.log("API /admin/configuracoes-loja GET - Inserted default config due to previous error or no data.");
        return defaultDataForDb as LojaConfiguracao;
    } catch (insertErr: any) {
        console.error("API /admin/configuracoes-loja GET - Critical error: Failed to insert default config after fetch error:", insertErr.message);
        // Return hardcoded defaults if even insert fails
        return { ...DefaultLojaConfig, id: CONFIG_ID, created_at: new Date().toISOString(), updated_at: new Date().toISOString()};
    }
  }

  if (!data) {
    console.warn("API /admin/configuracoes-loja GET - No config row in Supabase for ID. Attempting to create one with defaults.");
    const defaultDataForDb = {
        id: CONFIG_ID,
        ...DefaultLojaConfig,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    };
    const { data: insertedData, error: insertError } = await supabaseServerClient.from('loja_configuracoes').insert(defaultDataForDb).select().single();
    if (insertError) {
        console.error("API /admin/configuracoes-loja GET - Failed to insert default config row:", insertError);
        return { ...DefaultLojaConfig, id: CONFIG_ID, created_at: new Date().toISOString(), updated_at: new Date().toISOString()};
    }
    console.log("API /admin/configuracoes-loja GET - Default config row inserted.");
    return insertedData as LojaConfiguracao;
  }

  // Ensure all expected fields are present, falling back to defaults if a field is null/missing
  return {
    id: data.id || CONFIG_ID,
    nome_loja: data.nome_loja || DefaultLojaConfig.nome_loja,
    endereco_loja: data.endereco_loja || DefaultLojaConfig.endereco_loja,
    whatsapp_loja: data.whatsapp_loja || DefaultLojaConfig.whatsapp_loja,
    instagram_loja: data.instagram_loja || DefaultLojaConfig.instagram_loja,
    logo_url: data.logo_url || DefaultLojaConfig.logo_url,
    horarios_funcionamento: (data.horarios_funcionamento as HorarioDia[] | null) || DefaultLojaConfig.horarios_funcionamento,
    override_status: (data.override_status as ShopOverrideStatus | null) || DefaultLojaConfig.override_status,
    mensagem_loja_fechada_personalizada: data.mensagem_loja_fechada_personalizada === undefined ? DefaultLojaConfig.mensagem_loja_fechada_personalizada : data.mensagem_loja_fechada_personalizada,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const fullConfig = await getFullConfigFromDb();
    return NextResponse.json(fullConfig);
  } catch (e: any) {
    console.error('API GET /admin/configuracoes-loja - Unexpected error:', e);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar configurações.', details: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const json = await request.json();
    console.log("API PUT /admin/configuracoes-loja - Received JSON for update:", JSON.stringify(json, null, 2));

    const parsedData = LojaConfiguracaoUpdateSchema.safeParse(json);

    if (!parsedData.success) {
      console.error("API PUT /admin/configuracoes-loja - Zod validation failed:", parsedData.error.flatten());
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: parsedData.error.flatten() }, { status: 400 });
    }
    console.log("API PUT /admin/configuracoes-loja - Parsed data:", parsedData.data);

    // Prepare the payload for Supabase, explicitly including all fields from the schema
    // to ensure even null values are passed if they are part of the validated data.
    const updatePayload: Partial<Database['public']['Tables']['loja_configuracoes']['Update']> = {
      nome_loja: parsedData.data.nome_loja,
      endereco_loja: parsedData.data.endereco_loja,
      whatsapp_loja: parsedData.data.whatsapp_loja,
      instagram_loja: parsedData.data.instagram_loja,
      logo_url: parsedData.data.logo_url, // This will be the string URL or null
      horarios_funcionamento: parsedData.data.horarios_funcionamento as unknown as Json,
      override_status: parsedData.data.override_status,
      updated_at: new Date().toISOString(),
    };
    
    // Specific handling for mensagem_loja_fechada_personalizada based on override_status
    if (parsedData.data.override_status === 'forcar_fechado') {
      updatePayload.mensagem_loja_fechada_personalizada = parsedData.data.mensagem_loja_fechada_personalizada || SHOP_FORCED_MANUALLY_CLOSED_MESSAGE;
    } else if (parsedData.data.hasOwnProperty('mensagem_loja_fechada_personalizada')) {
      // If the field is explicitly sent (even if null or empty), respect it.
      // This allows clearing the message if override_status is not 'forcar_fechado'.
      updatePayload.mensagem_loja_fechada_personalizada = parsedData.data.mensagem_loja_fechada_personalizada;
    }
    // If 'mensagem_loja_fechada_personalizada' is not in parsedData.data and override_status is not 'forcar_fechado',
    // it will not be included in updatePayload, leaving the DB value as is.


    // Remove undefined properties from the payload
    // This ensures that only fields explicitly provided (or defaulted by Zod to null/value) are sent for update.
    Object.keys(updatePayload).forEach(key => {
      const k = key as keyof typeof updatePayload;
      if (updatePayload[k] === undefined) {
        delete updatePayload[k];
      }
    });
    
    console.log("API PUT /admin/configuracoes-loja - Final payload for Supabase upsert:", JSON.stringify(updatePayload, null, 2));
    console.log("API PUT /admin/configuracoes-loja - Attempting to save logo_url:", updatePayload.logo_url);


    const { data: upsertedData, error: dbError } = await supabaseServerClient
      .from('loja_configuracoes')
      .upsert({ id: CONFIG_ID, ...updatePayload }, { onConflict: 'id' })
      .select()
      .single();

    if (dbError) {
      console.error("API PUT /admin/configuracoes-loja - Error upserting to Supabase:", dbError);
      return NextResponse.json({ error: 'Falha ao salvar configurações no banco de dados.', details: dbError.message }, { status: 500 });
    }
    
    console.log("API PUT /admin/configuracoes-loja - Upsert successful. Returning full config.");
    const finalConfig = await getFullConfigFromDb(); // Fetch the complete, defaulted config after save
    return NextResponse.json(finalConfig);

  } catch (e: any) {
    console.error('API PUT /admin/configuracoes-loja - Unexpected error:', e);
    return NextResponse.json({ error: 'Erro interno do servidor ao salvar configurações.', details: e.message }, { status: 500 });
  }
}
