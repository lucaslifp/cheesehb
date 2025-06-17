
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const personalizable = searchParams.get('personalizable');

  if (personalizable !== 'true') {
    return NextResponse.json({ error: 'Query parameter "personalizable=true" is required.' }, { status: 400 });
  }

  try {
    const { count, error } = await supabaseServerClient
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('is_personalizable_pizza', true);

    if (error) {
      console.error('Error fetching count of personalizable pizzas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (e: any) {
    console.error('Unexpected error fetching count:', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
