
"use client";

import { useState } from 'react'; 
import { SaborPizzaForm, type SaborPizzaFormValues } from '@/components/admin/sabores-pizza/SaborPizzaForm';
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast";

export default function AdicionarSaborPizzaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: SaborPizzaFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/sabores-pizza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao cadastrar sabor de pizza.';
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
        title: "Sabor Cadastrado!",
        description: `O sabor "${data.nome}" foi cadastrado com sucesso.`,
      });
      router.push('/admin/sabores-pizza');
      router.refresh(); 
    } catch (error: any) {
      console.error("Erro ao cadastrar sabor:", error);
      toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <SaborPizzaForm onSubmit={handleSubmit} isLoading={isLoading} isEditMode={false} />
    </div>
  );
}
