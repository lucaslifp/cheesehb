// src/app/api/admin/grupos-opcionais/route.ts
//------------------------------------------------------------
//  Rotas REST para Grupos Opcionais e seus Itens
//------------------------------------------------------------
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServerClient as supabase } from "@/lib/supabaseServerClient";
import { z } from "zod";
import type { ItemOpcional, TipoSelecaoGrupo } from "@/types";

/* ------------------------------------------------------------------
 * VALIDATION – Zod
 * -----------------------------------------------------------------*/
const ItemOpcionalCreateSchema = z
  .object({
    id: z.string().uuid().optional(),
    /** Nome é obrigatório **somente** quando NÃO há produto_original_id */
    nome: z.string().min(1).optional().nullable(),
    preco_adicional: z.coerce
      .number()
      .min(0, "Preço adicional deve ser zero ou positivo."),
    produto_original_id: z.string().uuid().optional().nullable(),
    default_selecionado: z.boolean().default(false),
    ordem: z.number().int().default(0),
    ativo: z.boolean().default(true),
  })
  .refine((v) => (v.produto_original_id ? true : !!v.nome?.trim()), {
    message:
      "Nome do item é obrigatório quando não há produto original vinculado.",
  });

const GrupoOpcionalCreateSchema = z.object({
  nome: z.string().min(1, "Nome do grupo é obrigatório."),
  tipo_selecao: z.enum([
    "RADIO_OBRIGATORIO",
    "CHECKBOX_OPCIONAL_MULTI",
    "CHECKBOX_OBRIGATORIO_MULTI",
  ]),
  min_selecoes: z.coerce.number().int().optional().nullable(),
  max_selecoes: z.coerce.number().int().optional().nullable(),
  instrucao: z.string().optional().nullable(),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true),
  itens: z
    .array(ItemOpcionalCreateSchema)
    .min(1, "O grupo deve ter pelo menos um item."),
});

/* ------------------------------------------------------------------
 * GET  /api/admin/itens-opcionais
 * -----------------------------------------------------------------*/
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("grupos_opcionais")
      .select(
        `*,
         itens_opcionais ( * )`
      )
      .order("ordem", { ascending: true })
      .order("ordem", {
        foreignTable: "itens_opcionais",
        ascending: true,
      });

    if (error) {
      console.error("Erro ao buscar grupos_opcionais:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Erro inesperado no GET grupos_opcionais:", e);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------
 * POST  /api/admin/itens-opcionais      (criar grupo + itens)
 * -----------------------------------------------------------------*/
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GrupoOpcionalCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados de entrada inválidos.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { itens, ...grupoData } = parsed.data;

    /* 1️⃣  Inserir grupo --------------------------------------------------*/
    const { data: grupo, error: grupoErr } = await supabase
      .from("grupos_opcionais")
      .insert(grupoData)
      .select()
      .single();

    if (grupoErr || !grupo) {
      const msg =
        grupoErr?.code === "23505"
          ? `Já existe um grupo opcional chamado "${grupoData.nome}".`
          : grupoErr?.message || "Falha ao criar grupo.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    /* 2️⃣  Preparar itens  ------------------------------------------------*/
    const itensParaInserir = itens.map((item) => {
      const base = { ...item, grupo_opcional_id: grupo.id };

      // Se for vinculado a um produto original ⇒ mantém nome NULL
      if (item.produto_original_id) {
        return { ...base, nome: null };
      }

      return base;
    });

    /* 3️⃣  Inserir itens  -------------------------------------------------*/
    const { data: novosItens, error: itensErr } = await supabase
      .from("itens_opcionais")
      .insert(itensParaInserir)
      .select();

    if (itensErr) {
      console.error("Falha ao criar itens. Removendo grupo:", itensErr);
      // rollback manual
      await supabase.from("grupos_opcionais").delete().eq("id", grupo.id);

      return NextResponse.json(
        {
          error: "Falha ao criar itens do grupo. O grupo foi removido.",
          details: itensErr.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...grupo, itens: novosItens }, { status: 201 });
  } catch (e) {
    console.error("Erro inesperado no POST grupos_opcionais:", e);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
