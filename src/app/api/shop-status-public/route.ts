
import { NextResponse } from 'next/server';
import { supabaseServerClient as supabase } from '@/lib/supabaseServerClient';
import type { ShopOverrideStatus, HorarioDia } from '@/types';
import { SHOP_OPERATING_HOURS } from '@/lib/shop-config';

export const dynamic = 'force-dynamic';

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';

const DIAS_SEMANA_MAP_HORARIOS: { index: number; nome: string }[] = [
  { index: 0, nome: 'Domingo' }, { index: 1, nome: 'Segunda-feira' },
  { index: 2, nome: 'Terça-feira' }, { index: 3, nome: 'Quarta-feira' },
  { index: 4, nome: 'Quinta-feira' }, { index: 5, nome: 'Sexta-feira' },
  { index: 6, nome: 'Sábado' },
];

function convertShopHoursToHorarioDiaArray(shopHours: typeof SHOP_OPERATING_HOURS): HorarioDia[] {
  return DIAS_SEMANA_MAP_HORARIOS.map(day => {
    const hours = shopHours[day.index as keyof typeof SHOP_OPERATING_HOURS];
    return {
      diaIndex: day.index,
      nomeDia: day.nome,
      aberto: !!hours,
      abreAs: hours?.open || '00:00',
      fechaAs: hours?.close || '00:00',
    };
  });
}

const defaultHorariosFromShopConfig = convertShopHoursToHorarioDiaArray(SHOP_OPERATING_HOURS);

async function getShopSettingsFromDb() {
  const { data, error } = await supabase // Changed to supabase
    .from('loja_configuracoes')
    .select(`
      override_status,
      mensagem_loja_fechada_personalizada,
      horarios_funcionamento,
      nome_loja,
      endereco_loja,
      whatsapp_loja,
      instagram_loja,
      logo_url
    `)
    .eq('id', CONFIG_ID)
    .maybeSingle();

  if (error || !data) {
    console.error("Erro ao buscar loja_configuracoes:", error?.message);
    return {
      overrideStatus: 'automatico',
      customClosedMessage: null,
      horariosFuncionamento: defaultHorariosFromShopConfig,
      nomeLoja: 'Loja',
      enderecoLoja: '',
      whatsappLoja: '',
      instagramLoja: '',
      logoUrl: '',
    };
  }

  const validOverrideValues: ShopOverrideStatus[] = ['automatico', 'forcar_aberto', 'forcar_fechado'];
  const overrideStatus = validOverrideValues.includes(data.override_status as ShopOverrideStatus) ? data.override_status : 'automatico';

  return {
    overrideStatus,
    customClosedMessage: data.mensagem_loja_fechada_personalizada,
    horariosFuncionamento: data.horarios_funcionamento || defaultHorariosFromShopConfig,
    nomeLoja: data.nome_loja || '',
    enderecoLoja: data.endereco_loja || '',
    whatsappLoja: data.whatsapp_loja || '',
    instagramLoja: data.instagram_loja || '',
    logoUrl: data.logo_url || '',
  };
}

export async function GET() {
  try {
    const {
      overrideStatus,
      customClosedMessage,
      horariosFuncionamento,
      nomeLoja,
      enderecoLoja,
      whatsappLoja,
      instagramLoja,
      logoUrl,
    } = await getShopSettingsFromDb();

    return NextResponse.json({
      overrideStatus,
      shopClosedMessage: customClosedMessage,
      horariosFuncionamento,
      nomeLoja,
      enderecoLoja,
      whatsappLoja,
      instagramLoja,
      logoUrl,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });

  } catch (e: any) {
    console.error('Erro inesperado em /api/shop-status-public:', e);
    return NextResponse.json({
      overrideStatus: 'automatico',
      shopClosedMessage: null,
      horariosFuncionamento: defaultHorariosFromShopConfig,
      nomeLoja: 'Loja',
      enderecoLoja: '',
      whatsappLoja: '',
      instagramLoja: '',
      logoUrl: '',
    }, { status: 500 });
  }
}
