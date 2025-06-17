
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation'; 
import { toast } from '@/hooks/use-toast';

export function ProductSearchHeader() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter(); 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // For now, this is a placeholder. 
      // In a future iteration, this could navigate to a search results page
      // or trigger a filter action within the current page context.
      console.log("Search initiated for:", searchTerm);
      toast({
        title: "Pesquisa (Simulação)",
        description: `Você pesquisou por: "${searchTerm}". Funcionalidade completa de pesquisa em breve.`,
      });
      // Example for future navigation:
      // router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      toast({
        title: "Pesquisa Vazia",
        description: "Por favor, digite algo para pesquisar.",
        variant: "default",
      });
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-sm md:max-w-xs">
      <Input
        type="search"
        placeholder="Buscar produtos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-9 text-sm bg-background focus:bg-card transition-colors"
        aria-label="Buscar produtos"
      />
      <Button type="submit" size="icon" variant="ghost" className="h-9 w-9 shrink-0">
        <Search className="h-4 w-4" />
        <span className="sr-only">Buscar</span>
      </Button>
    </form>
  );
}
