
import type { HorarioDia } from '@/types'; // Assuming HorarioDia is defined in types

// Dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface OperatingHours {
  open: string; // Formato HH:MM
  close: string; // Formato HH:MM
}

// This constant is now primarily a fallback if DB data for horarios_funcionamento is missing/null.
// The actual operating hours should come from the loja_configuracoes table.
export const SHOP_OPERATING_HOURS: Partial<Record<DayOfWeek, OperatingHours>> = {
  0: { open: '18:00', close: '23:30' }, // Domingo
  1: { open: '18:00', close: '23:30' }, // Segunda
  // Terça-feira (day 2) está fechada por padrão (sem entrada aqui)
  3: { open: '18:00', close: '23:30' }, // Quarta
  4: { open: '18:00', close: '23:30' }, // Quinta
  5: { open: '18:00', close: '23:30' }, // Sexta
  6: { open: '18:00', close: '23:30' }, // Sábado
};

export const SHOP_GENERAL_HOURS_MESSAGE = "Funcionamos de Quarta a Segunda, das 18:00 às 23:30.";
export const SHOP_CLOSED_TODAY_MESSAGE = "Hoje estamos fechados.";
export const SHOP_OPENS_AT_MESSAGE = (time: string) => `Abrimos hoje às ${time}.`;
export const SHOP_CLOSES_AT_MESSAGE = (time: string) => `Fechamos hoje às ${time}. Ainda dá tempo!`;
export const SHOP_CURRENTLY_CLOSED_MESSAGE = "No momento, estamos fechados. ";
export const SHOP_MANUALLY_OPEN_MESSAGE = "A loja está aberta manualmente pelo administrador!";
// This specific message might be overridden by the "next opening time" logic
export const SHOP_FORCED_MANUALLY_CLOSED_MESSAGE = "A loja está temporariamente fechada pelo administrador.";

const DIAS_SEMANA_NOMES = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function getNextOpeningMessage(horarios: HorarioDia[] | null): string {
  if (!horarios || horarios.length === 0) {
    return SHOP_CURRENTLY_CLOSED_MESSAGE + SHOP_GENERAL_HOURS_MESSAGE;
  }

  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

  for (let d = 0; d < 7; d++) {
    const checkDayIndex = (currentDayIndex + d) % 7;
    const horarioDoDia = horarios.find(h => h.diaIndex === checkDayIndex && h.aberto);

    if (horarioDoDia && horarioDoDia.abreAs) {
      const [openHour, openMinute] = horarioDoDia.abreAs.split(':').map(Number);
      const openTimeInMinutes = openHour * 60 + openMinute;

      if (d === 0 && currentTimeInMinutes < openTimeInMinutes) {
        return `Estamos fechados. Abrimos hoje às ${horarioDoDia.abreAs}.`;
      } else if (d > 0 || (d === 0 && currentTimeInMinutes >= openTimeInMinutes)) {
        // If it's today but past opening, or a future day
        const dayName = (d === 1) ? "amanhã" : `na ${DIAS_SEMANA_NOMES[checkDayIndex]}`;
        return `Estamos fechados. Abrimos ${dayName} às ${horarioDoDia.abreAs}.`;
      }
    }
  }
  // Fallback if no open days found in the next 7 days (unlikely)
  return SHOP_CURRENTLY_CLOSED_MESSAGE + "Consulte nossos horários.";
}


export const getShopStatus = async (): Promise<{ isOpen: boolean; message: string }> => {
  let apiOverrideStatus: string | null = null;
  let apiShopClosedMessage: string | null = null;
  let apiHorariosFuncionamento: HorarioDia[] | null = null;
  
  console.log("getShopStatus: Iniciando verificação de status da loja.");
  try {
    const fetchUrl = `/api/shop-status-public?timestamp=${Date.now()}`;
    console.log(`getShopStatus: Fetching URL: ${fetchUrl}`);
    const res = await fetch(fetchUrl, { cache: 'no-store' });
    
    if (res.ok) {
      const data = await res.json();
      apiOverrideStatus = data.overrideStatus;
      apiShopClosedMessage = data.shopClosedMessage; // This is mensagem_loja_fechada_personalizada
      apiHorariosFuncionamento = data.horariosFuncionamento;
      console.log("getShopStatus: Sucesso ao buscar API pública.", { apiOverrideStatus, apiShopClosedMessage: apiShopClosedMessage != null, horariosLength: apiHorariosFuncionamento?.length });
    } else {
      const errorText = await res.text().catch(() => 'Falha ao ler corpo da resposta de erro');
      console.warn(`getShopStatus: Falha ao buscar status da API pública. Status Code: ${res.status}. Resposta: ${errorText}. Defaulting to 'automatico'.`);
      apiOverrideStatus = 'automatico';
    }
  } catch (error) {
    console.error("getShopStatus: Erro ao chamar /api/shop-status-public:", error, "Defaulting to 'automatico'.");
    apiOverrideStatus = 'automatico';
  }

  if (apiOverrideStatus === 'forcar_aberto') {
    console.log("getShopStatus: Prioridade Override! Decisão final -> LOJA FORÇADA ABERTA.");
    return { isOpen: true, message: SHOP_MANUALLY_OPEN_MESSAGE };
  }
  if (apiOverrideStatus === 'forcar_fechado') {
    console.log("getShopStatus: Prioridade Override! Decisão final -> LOJA FORÇADA FECHADA. Calculando próxima abertura...");
    const nextOpenMsg = getNextOpeningMessage(apiHorariosFuncionamento);
    return { isOpen: false, message: nextOpenMsg };
  }
  
  console.log("getShopStatus: Modo 'automatico' ativado. Verificando horários de funcionamento padrão...");
  const horariosParaVerificar = apiHorariosFuncionamento || []; // Use fetched horarios or empty if null

  const now = new Date();
  const currentDay = now.getDay() as DayOfWeek;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const todayHoursConfig = horariosParaVerificar.find(h => h.diaIndex === currentDay && h.aberto);

  if (!todayHoursConfig || !todayHoursConfig.abreAs || !todayHoursConfig.fechaAs) {
    console.log(`getShopStatus (Automático): Loja FECHADA (dia ${currentDay} sem horários definidos ou inválidos nos dados recebidos). Próxima abertura:`);
    const nextOpenMsg = getNextOpeningMessage(horariosParaVerificar);
    return { isOpen: false, message: nextOpenMsg };
  }

  const [openHour, openMinute] = todayHoursConfig.abreAs.split(':').map(Number);
  const openTimeInMinutes = openHour * 60 + openMinute;

  const [closeHour, closeMinute] = todayHoursConfig.fechaAs.split(':').map(Number);
  const closeTimeInMinutes = closeHour * 60 + closeMinute;

  console.log(`getShopStatus (Automático): Horário atual: ${currentHour}:${String(currentMinute).padStart(2, '0')} (${currentTimeInMinutes} min). Hoje (${todayHoursConfig.nomeDia}) abre: ${todayHoursConfig.abreAs} (${openTimeInMinutes} min), Fecha: ${todayHoursConfig.fechaAs} (${closeTimeInMinutes} min).`);

  if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
    console.log("getShopStatus (Automático): Loja ABERTA (dentro do horário de funcionamento).");
    return { isOpen: true, message: `Loja aberta! ${SHOP_CLOSES_AT_MESSAGE(todayHoursConfig.fechaAs)}` };
  } else {
    console.log("getShopStatus (Automático): Loja FECHADA (fora do horário de funcionamento). Calculando próxima abertura...");
    const nextOpenMsg = getNextOpeningMessage(horariosParaVerificar);
    return { isOpen: false, message: nextOpenMsg };
  }
};
