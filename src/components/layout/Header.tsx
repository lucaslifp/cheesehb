
import Link from 'next/link';
import Image from 'next/image';
import { supabaseServerClient as supabase } from '@/lib/supabaseServerClient';
import { ProductSearchHeader } from './ProductSearchHeader';

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_SHOP_NAME = 'CheesePizza';
const DEFAULT_LOGO_URL = 'https://placehold.co/160x60.png?text=Logo';

async function getShopInfo() {
  try {
    const { data, error } = await supabase
      .from('loja_configuracoes')
      .select('nome_loja, logo_url')
      .eq('id', CONFIG_ID)
      .single();

    if (error || !data) throw new Error(error?.message || 'Erro ao buscar dados');

    return {
      nome: data.nome_loja || DEFAULT_SHOP_NAME,
      logo: data.logo_url || DEFAULT_LOGO_URL,
    };
  } catch (e) {
    console.error('Erro ao buscar info da loja:', e);
    return {
      nome: DEFAULT_SHOP_NAME,
      logo: DEFAULT_LOGO_URL,
    };
  }
}

export async function Header() {
  const { nome, logo } = await getShopInfo();

  return (
    <header className="py-4 bg-card shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between px-4 gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-[120px] md:h-[45px]">
            <Image
              src={logo}
              alt="Logo da loja"
              fill
              sizes="(max-width: 768px) 48px, 120px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold text-primary hidden md:block">{nome}</h1>
        </Link>
        <div className="flex-grow flex justify-end">
          <ProductSearchHeader />
        </div>
      </div>
    </header>
  );
}
