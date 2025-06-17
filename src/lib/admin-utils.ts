
"use client";

import type { OrderStatusAdmin } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict, parseISO, differenceInHours, isValid as isDateValid, parse } from 'date-fns'; // Adicionado parse e isDateValid
import { ptBR } from 'date-fns/locale';

export const getStatusBadgeVariant = (status: OrderStatusAdmin): { variant: "default" | "destructive" | "outline" | "secondary", className?: string } => {
  switch (status) {
    case 'Novo':
      return { variant: 'secondary', className: 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200/80' };
    case 'Em Preparo':
      return { variant: 'secondary', className: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80' };
    case 'Saiu para Entrega':
      return { variant: 'secondary', className: 'bg-blue-500 text-blue-100 hover:bg-blue-500/80' };
    case 'Entregue':
      return { variant: 'secondary', className: 'bg-green-500 text-green-100 hover:bg-green-500/80' };
    case 'Cancelado':
      return { variant: 'outline' };
    default:
      return { variant: 'default' };
  }
};

export const formatTimeDifference = (dateString: string): { text: string; isOverdue: boolean } => {
  if (!dateString || dateString === 'Data Indisponível') {
    return { text: 'N/A', isOverdue: false };
  }
  try {
    let date: Date;
    // Tenta parsear como ISO string primeiro
    date = parseISO(dateString);
    
    // Fallback se o parse ISO falhar (para timestamps legados no formato dd/MM/yyyy, HH:mm:ss)
    if (!isDateValid(date)) {
      const parts = dateString.split(', ');
      if (parts.length === 2) {
        const dateParts = parts[0].split('/');
        const timeParts = parts[1].split(':');
        if (dateParts.length === 3 && timeParts.length === 3) {
          date = new Date(
            +dateParts[2],     // ano
            +dateParts[1] - 1, // mês (0-indexado)
            +dateParts[0],     // dia
            +timeParts[0],     // hora
            +timeParts[1],     // minuto
            +timeParts[2]      // segundo
          );
        }
      }
    }

    if (!isDateValid(date)) {
      console.warn(`Could not parse date string: ${dateString}`);
      return { text: 'Inválido', isOverdue: false };
    }

    const now = new Date();
    // A lógica original de 'isOverdue' era genérica para 2h.
    // A nova lógica de cor/piscar na página de pedidos lidará com 'overdue' específico do status.
    // Por isso, aqui, isOverdue pode ser mantido como estava ou ajustado se necessário.
    // Para este contexto, o isOverdue da função pode não ser mais usado para cor na linha.
    const hoursDifference = differenceInHours(now, date);
    const isGenerallyOverdue = hoursDifference >= 2; // Mantendo a lógica original para isOverdue

    const distance = formatDistanceToNowStrict(date, { addSuffix: true, locale: ptBR });
    
    let formattedDistance = distance
      .replace(/^há\s+cerca\s+de\s+/, '')
      .replace(/^há\s+/, '')
      .replace(/\s+horas?/, 'h')
      .replace(/\s+minutos?/, 'min')
      .replace(/\s+segundos?/, 's')
      .replace(/menos de um minuto/, '<1min')
      .replace(/um minuto/, '1min')
      .replace(/uma hora/, '1h');

    return { text: formattedDistance, isOverdue: isGenerallyOverdue };
  } catch (error) {
    console.error(`Error formatting time difference for date string "${dateString}":`, error);
    return { text: 'Erro', isOverdue: false };
  }
};
