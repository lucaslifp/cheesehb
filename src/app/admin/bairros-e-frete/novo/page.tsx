
"use client";

import { useState } from 'react'; 
import { BairroEntregaForm, type BairroEntregaFormValues } from '@/components/admin/bairros-entrega/BairroEntregaForm';
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast";

export default function AdicionarBairroEntregaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: BairroEntregaFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bairros-entrega', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao cadastrar bairro/área.';
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
        title: "Bairro/Área Cadastrado!",
        description: `O bairro/área "${data.nome}" foi cadastrado com sucesso.`,
      });
      router.push('/admin/bairros-e-frete');
      router.refresh(); 
    } catch (error: any) {
      console.error("Erro ao cadastrar bairro:", error);
      toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <BairroEntregaForm onSubmit={handleSubmit} isLoading={isLoading} isEditMode={false} />
    </div>
  );
}
