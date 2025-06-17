
"use client";

import { useState, useEffect } from 'react';
import { BordaPizzaForm, type BordaPizzaFormValues } from '@/components/admin/bordas-pizza/BordaPizzaForm';
import { useRouter, useParams } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import type { Borda } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditarBordaPizzaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [borda, setBorda] = useState<Borda | null>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchBorda = async () => {
        setIsFetching(true);
        try {
          const response = await fetch(`/api/admin/bordas-pizza/${id}`);
          if (!response.ok) {
            let errorDetail = 'Falha ao buscar dados da borda.';
            const errorText = await response.text();
            try {
              const errorData = JSON.parse(errorText);
              if (errorData && errorData.error) {
                errorDetail = errorData.error;
              } else {
                errorDetail = `Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
              }
            } catch (parseError) {
              errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
            }
            throw new Error(errorDetail);
          }
          const data: Borda = await response.json(); // API now returns Borda with preco_pequena/grande
          setBorda(data); 
        } catch (error: any) {
          console.error(error);
          toast({ title: "Erro", description: error.message || "Não foi possível carregar a borda para edição.", variant: "destructive" });
          router.push('/admin/bordas-pizza');
        } finally {
          setIsFetching(false);
        }
      };
      fetchBorda();
    }
  }, [id, router]);

  const handleSubmit = async (data: BordaPizzaFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/bordas-pizza/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // Form data already includes preco_pequena and preco_grande
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao atualizar a borda.';
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData && errorData.error) {
            errorDetail = errorData.error;
          } else {
            errorDetail = `Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
          }
        } catch (parseError) {
          errorDetail = `Erro ao processar resposta do servidor. Status: ${response.status}. Resposta: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
        }
        throw new Error(errorDetail);
      }

      toast({
        title: "Borda Atualizada!",
        description: `A borda "${data.nome}" foi atualizada com sucesso.`,
      });
      router.push('/admin/bordas-pizza');
      router.refresh(); 
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando dados da borda...</p>
      </div>
    );
  }

  if (!borda) {
    return (
         <div className="text-center py-12">
            <p className="mb-4">Borda não encontrada ou erro ao carregar.</p>
            <Link href="/admin/bordas-pizza">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Bordas
                </Button>
            </Link>
        </div>
    );
  }
  // The BordaPizzaForm expects initialData to have preco_pequena and preco_grande
  return (
    <div>
      <BordaPizzaForm onSubmit={handleSubmit} initialData={borda} isLoading={isLoading} isEditMode={true} />
    </div>
  );
}

