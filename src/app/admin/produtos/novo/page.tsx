"use client";

import { ProdutoForm, type ProdutoDataToSubmit } from '@/components/admin/produtos/ProdutoForm';
import { useRouter } from 'next/navigation'; 
import { toast } from "@/hooks/use-toast";
import { useState } from 'react';

export default function AdicionarProdutoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ProdutoDataToSubmit) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error || 'Erro ao cadastrar produto.');
      }

      const produtoId = responseData?.id;

      toast({
        title: "Produto Cadastrado!",
        description: `O produto "${data.nome}" foi cadastrado com sucesso.`,
      });

      // Redireciona para o menu certo
      router.push(data.is_personalizable_pizza ? '/admin/pizzas' : '/admin/produtos');
      router.refresh(); 
    } catch (error: any) {
      console.error("Erro ao cadastrar produto:", error);
      toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ProdutoForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isEditMode={false}
        initialProductType="produto_geral"
      />
    </div>
  );
}
