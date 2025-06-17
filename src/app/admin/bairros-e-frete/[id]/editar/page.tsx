
"use client";

import { useState, useEffect } from 'react';
import { BairroEntregaForm, type BairroEntregaFormValues } from '@/components/admin/bairros-entrega/BairroEntregaForm';
import { useRouter, useParams } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import type { BairroEntrega } from '@/types'; 
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditarBairroEntregaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [bairro, setBairro] = useState<BairroEntregaFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchBairro = async () => {
        setIsFetching(true);
        try {
          const response = await fetch(`/api/admin/bairros-entrega/${id}`);
          if (!response.ok) {
            let errorDetail = 'Falha ao buscar dados do bairro/área.';
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
          const data: BairroEntrega = await response.json();
          setBairro({
            nome: data.nome,
            taxa_entrega: data.taxa_entrega,
            tempo_estimado_entrega_minutos: data.tempo_estimado_entrega_minutos,
            ativo: data.ativo !== undefined ? data.ativo : true,
          });
        } catch (error: any) {
          console.error(error);
          toast({ title: "Erro", description: error.message || "Não foi possível carregar o bairro/área para edição.", variant: "destructive" });
          router.push('/admin/bairros-e-frete');
        } finally {
          setIsFetching(false);
        }
      };
      fetchBairro();
    }
  }, [id, router]);

  const handleSubmit = async (data: BairroEntregaFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/bairros-entrega/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao atualizar o bairro/área.';
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
        title: "Bairro/Área Atualizado!",
        description: `O bairro/área "${data.nome}" foi atualizado com sucesso.`,
      });
      router.push('/admin/bairros-e-frete');
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
        <p className="ml-2">Carregando dados do bairro/área...</p>
      </div>
    );
  }

  if (!bairro) {
    return (
         <div className="text-center py-12">
            <p className="mb-4">Bairro/Área não encontrado ou erro ao carregar.</p>
            <Link href="/admin/bairros-e-frete">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Bairros e Frete
                </Button>
            </Link>
        </div>
    );
  }

  return (
    <div>
      <BairroEntregaForm onSubmit={handleSubmit} initialData={bairro} isLoading={isLoading} isEditMode={true} />
    </div>
  );
}

