
"use client";

import { useState, useEffect } from 'react';
import { SaborPizzaForm, type SaborPizzaFormValues } from '@/components/admin/sabores-pizza/SaborPizzaForm';
import { useRouter, useParams } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import type { SaborPizza } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditarSaborPizzaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [sabor, setSabor] = useState<SaborPizzaFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchSabor = async () => {
        setIsFetching(true);
        try {
          const response = await fetch(`/api/admin/sabores-pizza/${id}`);
          if (!response.ok) {
            let errorDetail = 'Falha ao buscar dados do sabor.';
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
          const data: SaborPizza = await response.json();
          setSabor({
            nome: data.nome,
            descricao: data.descricao || "", 
            preco_grande: data.preco_grande,
            preco_pequena: data.preco_pequena,
            categoria_sabor: data.categoria_sabor,
            ativo: data.ativo !== undefined ? data.ativo : true, 
          });
        } catch (error: any) {
          console.error(error);
          toast({ title: "Erro", description: error.message || "Não foi possível carregar o sabor para edição.", variant: "destructive" });
          router.push('/admin/sabores-pizza');
        } finally {
          setIsFetching(false);
        }
      };
      fetchSabor();
    }
  }, [id, router]);

  const handleSubmit = async (data: SaborPizzaFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/sabores-pizza/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao atualizar o sabor.';
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
        title: "Sabor Atualizado!",
        description: `O sabor "${data.nome}" foi atualizado com sucesso.`,
      });
      router.push('/admin/sabores-pizza');
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
        <p className="ml-2">Carregando dados do sabor...</p>
      </div>
    );
  }

  if (!sabor) {
    return (
         <div className="text-center py-12">
            <p className="mb-4">Sabor não encontrado ou erro ao carregar.</p>
            <Link href="/admin/sabores-pizza">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Sabores
                </Button>
            </Link>
        </div>
    );
  }

  return (
    <div>
      <SaborPizzaForm onSubmit={handleSubmit} initialData={sabor} isLoading={isLoading} isEditMode={true} />
    </div>
  );
}
