
"use client";

import { useState, useEffect } from 'react';
import { ProdutoForm, type ProdutoDataToSubmit } from '@/components/admin/produtos/ProdutoForm';
import type { ProdutoAdmin } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [produto, setProduto] = useState<ProdutoAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchProduto = async () => {
        setIsFetching(true);
        try {
          const response = await fetch(`/api/admin/produtos/${id}`);
          if (!response.ok) {
            let errorDetail = 'Falha ao buscar dados do produto.';
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
          const data: ProdutoAdmin = await response.json();
          // Ensure for general products, is_personalizable_pizza is false or null
          if (data.is_personalizable_pizza === true) {
             console.warn(`Produto ${data.id} carregado na página de edição de produto geral, mas está marcado como pizza personalizável. Verifique o roteamento ou dados.`);
             // Potentially redirect or show an error, but for now, we let the form reflect it.
             // The handleSubmit will enforce is_personalizable_pizza: false for this route.
          }
          setProduto(data);
        } catch (error: any) {
          console.error(error);
          toast({ title: "Erro", description: error.message || "Não foi possível carregar o produto para edição.", variant: "destructive" });
          router.push('/admin/produtos');
        } finally {
          setIsFetching(false);
        }
      };
      fetchProduto();
    }
  }, [id, router]);

  const handleSubmit = async (data: ProdutoDataToSubmit) => {
    setIsLoading(true);
    
    // Data from ProdutoForm already includes the correct imagem_url (if uploaded/changed)
    // and is_personalizable_pizza reflects the form's state.
    // For this "general product" edit page, we enforce is_personalizable_pizza = false.
    const finalData = {
      ...data,
      is_personalizable_pizza: false, 
    };

    try {
      const response = await fetch(`/api/admin/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        let errorDetail = 'Falha ao atualizar o produto.';
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
        title: "Produto Atualizado!",
        description: `O produto "${finalData.nome}" foi atualizado com sucesso.`,
      });
      
      router.push('/admin/produtos'); // Redirect back to general products list
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
        <p className="ml-2">Carregando dados do produto...</p>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="text-center py-12">
        <p className="mb-4">Produto não encontrado ou erro ao carregar.</p>
        <Link href="/admin/produtos">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Produtos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ProdutoForm 
        onSubmit={handleSubmit} 
        initialData={produto} 
        isLoading={isLoading} 
        isEditMode={true} 
        initialProductType="produto_geral" // This ensures the form starts with correct pizza settings off
      />
    </div>
  );
}
