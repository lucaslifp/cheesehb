
import { z } from "zod";

// Define the base object schema without refinements first
const BaseProdutoZodObjectSchema = z.object({
  nome: z.string().min(1, "Nome do produto é obrigatório."),
  descricao: z.string().nullable().optional(),
  ingredientes: z.array(z.string()).nullable().optional(),
  imagem_url: z.string().url("URL da imagem inválida.").nullable().optional(),
  image_hint: z.string().max(50, "Hint da imagem deve ter no máximo 50 caracteres.").nullable().optional(),
  preco_base: z.number().min(0, "Preço base deve ser positivo ou zero.").optional(), // Optional, refinement will enforce for non-pizzas
  preco_promocional: z.number().min(0).nullable().optional(),
  categoria_id: z.string().uuid("ID da categoria inválido.").nullable().optional(),
  ativo: z.boolean().default(true).optional(),
  mostrar_no_cardapio: z.boolean().default(true).optional(),
  usar_como_adicional: z.boolean().default(false).optional(),
  onde_aparece_como_adicional: z.array(z.string()).nullable().optional(),
  is_personalizable_pizza: z.boolean().default(false).optional(),
  available_sizes: z.array(z.string()).nullable().optional(), 
  tipo_pizza: z.enum(["salgada", "doce"]).nullable().optional(), 
  grupos_opcionais_ids: z.array(z.string().uuid()).nullable().optional(),
});

// Define common refinements that can be applied to both create and update schemas
const commonRefinements = (schema: z.ZodTypeAny) => 
  schema.refine(
    (data) => {
      // If it's a personalizable pizza, preco_base can be undefined (it will be omitted).
      if (data.is_personalizable_pizza) {
        return true;
      }
      // If it's NOT a personalizable pizza, preco_base must be defined and a number.
      return data.preco_base !== undefined && typeof data.preco_base === 'number';
    },
    {
      message: "Preço base é obrigatório e deve ser um número para produtos que não são pizzas personalizáveis.",
      path: ["preco_base"],
    }
  ).refine(
    (data) => {
      if (data.is_personalizable_pizza) {
        return (
          data.available_sizes && data.available_sizes.length > 0 &&
          (data.tipo_pizza === "salgada" || data.tipo_pizza === "doce")
        );
      }
      return true;
    },
    {
      message: "Para pizzas personalizáveis, 'Tamanho da Pizza Base' (available_sizes) e 'Tipo da Pizza Base' (tipo_pizza) são obrigatórios.",
      path: ["is_personalizable_pizza"], 
    }
  );

export const ProdutoCreateSchema = commonRefinements(BaseProdutoZodObjectSchema);
export type ProdutoCreate = z.infer<typeof ProdutoCreateSchema>;

export const ProdutoUpdateSchema = commonRefinements(
  BaseProdutoZodObjectSchema.partial().extend({ // Apply partial to the base object
    id: z.string().uuid("ID do produto é obrigatório para atualização."),
  })
);
export type ProdutoUpdate = z.infer<typeof ProdutoUpdateSchema>;
