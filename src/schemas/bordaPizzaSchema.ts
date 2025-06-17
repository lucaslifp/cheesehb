
import { z } from "zod";

export const BordaPizzaCreateSchema = z.object({
  nome: z.string().min(1, "O nome da borda é obrigatório."),
  descricao: z.string().nullable().optional(),
  preco_pequena: z.number().min(0, "Preço para pizza pequena deve ser positivo ou zero."),
  preco_grande: z.number().min(0, "Preço para pizza grande deve ser positivo ou zero."),
  ativo: z.boolean().default(true).optional(),
  // preco_adicional is removed
});

export type BordaPizzaCreate = z.infer<typeof BordaPizzaCreateSchema>;

export const BordaPizzaUpdateSchema = BordaPizzaCreateSchema.partial().extend({
  id: z.string().uuid("ID da borda é obrigatório para atualização."),
});

export type BordaPizzaUpdate = z.infer<typeof BordaPizzaUpdateSchema>;

