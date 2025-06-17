
import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabaseServerClient';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const produtoId = formData.get('produtoId') as string | null;

    if (!file || !produtoId) {
      return NextResponse.json({ error: 'Arquivo ou produtoId ausente.' }, { status: 400 });
    }

    if (file.size > 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo maior que 1MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const path = `produtos/${produtoId}.main.png`;

    const { error: uploadError } = await supabaseServerClient.storage
      .from('public-assets')
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || 'image/png',
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError.message);
      return NextResponse.json({ error: 'Falha ao salvar imagem.' }, { status: 500 });
    }

    const { data: urlData } = supabaseServerClient.storage
      .from('public-assets')
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro desconhecido.' }, { status: 500 });
  }
}
