import { z } from "zod";

export const SaborPizzaCreateSchema = z.object({
  // id: z.string().uuid().optional(), // Gerado pelo DB
  nome: z.string().min(1, "O nome do sabor é obrigatório."),
  descricao: z.string().nullable().optional(),
  preco_grande: z.number().min(0, "Preço para pizza grande deve ser positivo ou zero."),
  preco_pequena: z.number().min(0, "Preço para pizza pequena deve ser positivo ou zero."),
  categoria_sabor: z.enum(['Salgada', 'Doce'], { 
    required_error: "Categoria do sabor (Salgada/Doce) é obrigatória."
  }),
  ativo: z.boolean().default(true).optional(),
  // created_at é gerenciado pelo DB
});

export type SaborPizzaCreate = z.infer<typeof SaborPizzaCreateSchema>;

export const SaborPizzaUpdateSchema = SaborPizzaCreateSchema.partial().extend({
  id: z.string().uuid("ID do sabor é obrigatório para atualização."),
});

export type SaborPizzaUpdate = z.infer<typeof SaborPizzaUpdateSchema>;
