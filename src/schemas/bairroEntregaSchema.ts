import { z } from "zod";

export const BairroEntregaCreateSchema = z.object({
  // id: z.string().uuid().optional(), // Gerado pelo DB
  nome: z.string().min(1, "O nome do bairro é obrigatório."),
  taxa_entrega: z.coerce.number().min(0, "A taxa de entrega não pode ser negativa."), // coerce para converter string do form
  tempo_estimado_entrega_minutos: z.coerce.number().int().positive("O tempo estimado deve ser um número positivo.").nullable().optional(),
  ativo: z.boolean().default(true).optional(),
  // created_at é gerenciado pelo DB
});

export type BairroEntregaCreate = z.infer<typeof BairroEntregaCreateSchema>;

export const BairroEntregaUpdateSchema = BairroEntregaCreateSchema.partial().extend({
  id: z.string().uuid("ID do bairro é obrigatório para atualização."),
});

export type BairroEntregaUpdate = z.infer<typeof BairroEntregaUpdateSchema>;
