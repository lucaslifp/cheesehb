import { z } from "zod";

export const CategoriaCreateSchema = z.object({
  // id: z.string().uuid().optional(), // Gerado pelo DB
  nome: z.string().min(1, "O nome da categoria é obrigatório."),
  ordem: z.number().int().gte(0).nullable().optional(),
  mostrar_nos_filtros_homepage: z.boolean().default(true).optional(),
  // created_at é gerenciado pelo DB
});

export type CategoriaCreate = z.infer<typeof CategoriaCreateSchema>;

export const CategoriaUpdateSchema = CategoriaCreateSchema.partial().extend({
  id: z.string().uuid("ID da categoria é obrigatório para atualização."),
});

export type CategoriaUpdate = z.infer<typeof CategoriaUpdateSchema>;
