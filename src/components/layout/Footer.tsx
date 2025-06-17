
import { Phone, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { supabaseServerClient } from '@/lib/supabaseServerClient';

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULTS = {
  nome_loja: 'CheesePizza',
  whatsapp: '(00) 0000-0000',
  endereco: 'Endereço não informado',
  horario: 'Horário não informado',
  instagram: null,
};

function agruparDias(horarios: any[]) {
  if (!horarios || horarios.length === 0) return [];

  const grupos: { dias: string[]; abre: string; fecha: string }[] = [];

  for (const dia of horarios) {
    const ultimoGrupo = grupos[grupos.length - 1];
    if (
      ultimoGrupo &&
      ultimoGrupo.abre === dia.abreAs &&
      ultimoGrupo.fecha === dia.fechaAs &&
      dia.diaIndex ===
        horarios.findIndex((d) => d.nomeDia === ultimoGrupo.dias.at(-1)) + 1
    ) {
      ultimoGrupo.dias.push(dia.nomeDia);
    } else {
      grupos.push({
        dias: [dia.nomeDia],
        abre: dia.abreAs,
        fecha: dia.fechaAs,
      });
    }
  }

  return grupos.map(({ dias, abre, fecha }) => {
    const nome =
      dias.length === 1
        ? dias[0]
        : `${dias[0]} a ${dias[dias.length - 1]}`;
    return `${nome} das ${abre} às ${fecha}`;
  });
}

async function getShopFooterData() {
  try {
    const { data, error } = await supabaseServerClient // Changed to supabaseServerClient
      .from('loja_configuracoes')
      .select(
        'nome_loja, whatsapp_loja, endereco_loja, horarios_funcionamento, instagram_loja'
      )
      .eq('id', CONFIG_ID)
      .single();

    if (error || !data) throw new Error(error?.message || 'Dados ausentes');

    const horarios = data.horarios_funcionamento?.filter((d: any) => d.aberto) || [];
    const diasAgrupados = agruparDias(horarios);

    const horarioTexto = diasAgrupados.length
      ? 'Aberto:\n' + diasAgrupados.map((h) => `  ${h}`).join('\n')
      : DEFAULTS.horario;

    return {
      nome_loja: data.nome_loja || DEFAULTS.nome_loja,
      whatsapp: data.whatsapp_loja || DEFAULTS.whatsapp,
      endereco: data.endereco_loja || DEFAULTS.endereco,
      horario: horarioTexto,
      instagram: data.instagram_loja || null,
    };
  } catch (e) {
    console.error('Erro ao carregar dados do rodapé:', e);
    return DEFAULTS;
  }
}

export async function Footer() {
  const { nome_loja, whatsapp, endereco, horario, instagram } =
    await getShopFooterData();

  const whatsappLink = whatsapp.replace(/\D/g, ''); // remove símbolos

  return (
    <footer className="py-8 mt-12 border-t bg-card">
      <div className="container mx-auto px-4 text-center md:text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-xl font-headline font-semibold text-primary mb-3">{nome_loja}</h3>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-lg font-headline font-semibold text-primary mb-3">Contato</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center justify-center md:justify-start">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                <span>{whatsapp}</span>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <span>{endereco}</span>
              </li>
              <li className="flex items-start justify-center md:justify-start whitespace-pre-line">
                <Clock className="h-5 w-5 mr-2 text-primary mt-1" />
                <span>{horario}</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h3 className="text-lg font-headline font-semibold text-primary mb-3">Siga-nos</h3>
            <ul className="space-y-1 text-muted-foreground">
              {instagram && (
                <li>
                  <Link
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Instagram
                  </Link>
                </li>
              )}
              {whatsappLink && (
                <li>
                  <Link
                    href={`https://wa.me/${whatsappLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    WhatsApp
                  </Link>
                </li>
              )}
              {!instagram && !whatsappLink && (
                <li className="text-sm">(Em breve links para redes sociais)</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
