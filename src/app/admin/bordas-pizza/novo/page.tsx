
"use client";

import { useState } from 'react'; 
import { BordaPizzaForm, type BordaPizzaFormValues } from '@/components/admin/bordas-pizza/BordaPizzaForm';
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast";

export default function AdicionarBordaPizzaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: BordaPizzaFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bordas-pizza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao cadastrar opção de borda.';
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
        title: "Borda Cadastrada!",
        description: `A opção de borda "${data.nome}" foi cadastrada com sucesso.`,
      });
      router.push('/admin/bordas-pizza');
      router.refresh(); 
    } catch (error: any) {
      console.error("Erro ao cadastrar borda:", error);
      toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <BordaPizzaForm onSubmit={handleSubmit} isLoading={isLoading} isEditMode={false} />
    </div>
  );
}
