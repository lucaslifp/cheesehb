
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <FileQuestion className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary mb-4">404 - Página Não Encontrada</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Oops! Parece que a página que você está procurando não existe ou foi movida.
      </p>
      <Link href="/">
        <Button size="lg">Voltar para a Página Inicial</Button>
      </Link>
    </div>
  );
}
