
// src/app/admin/pizzas/nova/page.tsx

"use client";

import { ProdutoForm } from '@/components/admin/produtos/ProdutoForm';
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import { useState } from 'react';
import type { ProdutoCreate } from '@/schemas'; // Import Zod-derived type

export default function AdicionarPizzaBasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // The type of `data` here should align with what ProdutoForm's onSubmit provides,
  // which should be compatible with ProdutoCreate.
  const handleSubmit = async (data: Omit<ProdutoCreate, "id">) => {
    setIsLoading(true);

    // Ensure `is_personalizable_pizza` is true and `preco_base` is omitted for API call
    const payload: ProdutoCreate = {
      ...data,
      is_personalizable_pizza: true,
      preco_base: undefined, // Explicitly set to undefined to be omitted by JSON.stringify
    };
    
    // The `tipo_pizza` and `available_sizes` should be correctly set by ProdutoForm for personalizable pizzas
    // and will be part of the `data` object, then included in `payload`.

    try {
      const response = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), 
      });

      const responseData = await response.json();

      if (!response.ok) {
        let apiErrorMessage = responseData?.error || `Erro ${response.status} ao cadastrar pizza base.`;
        let apiErrorDetails = "";

        if (responseData?.details) {
          if (typeof responseData.details === 'string') {
            apiErrorDetails = responseData.details;
          } else if (responseData.details.fieldErrors) { 
            apiErrorDetails = Object.entries(responseData.details.fieldErrors)
              // @ts-ignore
              .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
              .join('; ');
          } else { 
            apiErrorDetails = JSON.stringify(responseData.details);
          }
        } else if (responseData?.error && !responseData.details) { 
            apiErrorDetails = responseData.error;
        }

        if (!responseData?.error && !responseData?.details && response.status !== 201 && response.status !== 200) {
            const errorText = await response.text().catch(() => 'Corpo da resposta de erro não pôde ser lido.');
            apiErrorMessage = `Erro ${response.status}: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
        }
        throw new Error(apiErrorDetails ? `${apiErrorMessage} Detalhes: ${apiErrorDetails}` : apiErrorMessage);
      }

      toast({
        title: "Pizza Base Cadastrada!",
        description: `A opção de pizza base "${data.nome}" foi cadastrada com sucesso.`,
      });

      router.push('/admin/pizzas');
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao cadastrar pizza base:", error);
      toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive", duration: 10000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ProdutoForm
        onSubmit={handleSubmit as any} // Cast to any if type mismatch, but should be compatible
        isLoading={isLoading}
        isEditMode={false}
        initialProductType="pizza_personalizavel"
      />
    </div>
  );
}
