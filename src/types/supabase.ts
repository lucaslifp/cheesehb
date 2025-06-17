export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      adicionais_pizza: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          preco: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          preco?: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          preco?: number
        }
        Relationships: []
      }
      bairros_entrega: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          taxa_entrega: number
          tempo_estimado_entrega_minutos: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          taxa_entrega?: number
          tempo_estimado_entrega_minutos?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          taxa_entrega?: number
          tempo_estimado_entrega_minutos?: number | null
        }
        Relationships: []
      }
      bordas_pizza: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          preco_grande: number
          preco_pequena: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          preco_grande: number
          preco_pequena: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          preco_grande?: number
          preco_pequena?: number
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string | null
          id: string
          mostrar_nos_filtros_homepage: boolean | null
          nome: string
          ordem: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mostrar_nos_filtros_homepage?: boolean | null
          nome: string
          ordem?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mostrar_nos_filtros_homepage?: boolean | null
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string | null
          data_cadastro: string | null
          id: string
          nao_receber_promocoes: boolean | null
          nome: string
          telefone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_cadastro?: string | null
          id?: string
          nao_receber_promocoes?: boolean | null
          nome: string
          telefone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_cadastro?: string | null
          id?: string
          nao_receber_promocoes?: boolean | null
          nome?: string
          telefone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      grupos_opcionais: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          instrucao: string | null
          max_selecoes: number | null
          min_selecoes: number | null
          nome: string
          ordem: number | null
          tipo_selecao: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          instrucao?: string | null
          max_selecoes?: number | null
          min_selecoes?: number | null
          nome: string
          ordem?: number | null
          tipo_selecao: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          instrucao?: string | null
          max_selecoes?: number | null
          min_selecoes?: number | null
          nome?: string
          ordem?: number | null
          tipo_selecao?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      itens_opcionais: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          default_selecionado: boolean | null
          grupo_opcional_id: string
          id: string
          nome: string
          ordem: number | null
          preco_adicional: number
          produto_original_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          default_selecionado?: boolean | null
          grupo_opcional_id: string
          id?: string
          nome: string
          ordem?: number | null
          preco_adicional?: number
          produto_original_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          default_selecionado?: boolean | null
          grupo_opcional_id?: string
          id?: string
          nome?: string
          ordem?: number | null
          preco_adicional?: number
          produto_original_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_opcionais_grupo_opcional_id_fkey"
            columns: ["grupo_opcional_id"]
            isOneToOne: false
            referencedRelation: "grupos_opcionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_opcionais_produto_original_id_fkey"
            columns: ["produto_original_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_configuracoes: {
        Row: {
          endereco_loja: string | null
          horarios_funcionamento: Json | null
          id: string
          instagram_loja: string | null
          logo_url: string | null
          mensagem_loja_fechada_personalizada: string | null
          nome_loja: string | null
          override_status:
            | Database["public"]["Enums"]["shop_override_status_enum"]
            | null
          updated_at: string | null
          whatsapp_loja: string | null
        }
        Insert: {
          endereco_loja?: string | null
          horarios_funcionamento?: Json | null
          id: string
          instagram_loja?: string | null
          logo_url?: string | null
          mensagem_loja_fechada_personalizada?: string | null
          nome_loja?: string | null
          override_status?:
            | Database["public"]["Enums"]["shop_override_status_enum"]
            | null
          updated_at?: string | null
          whatsapp_loja?: string | null
        }
        Update: {
          endereco_loja?: string | null
          horarios_funcionamento?: Json | null
          id?: string
          instagram_loja?: string | null
          logo_url?: string | null
          mensagem_loja_fechada_personalizada?: string | null
          nome_loja?: string | null
          override_status?:
            | Database["public"]["Enums"]["shop_override_status_enum"]
            | null
          updated_at?: string | null
          whatsapp_loja?: string | null
        }
        Relationships: []
      }
      pedido_itens: {
        Row: {
          adicionais_cobertura_selecionados: Json | null
          borda_id: string | null
          created_at: string | null
          id: string
          nome_produto_no_pedido: string
          observacoes_item: string | null
          opcionais_selecionados_item: Json | null
          pedido_id: string
          preco_total_item_no_pedido: number
          preco_unitario_no_pedido: number
          produto_id: string | null
          quantidade: number
          sabor1_id: string | null
          sabor2_id: string | null
        }
        Insert: {
          adicionais_cobertura_selecionados?: Json | null
          borda_id?: string | null
          created_at?: string | null
          id?: string
          nome_produto_no_pedido: string
          observacoes_item?: string | null
          opcionais_selecionados_item?: Json | null
          pedido_id: string
          preco_total_item_no_pedido: number
          preco_unitario_no_pedido: number
          produto_id?: string | null
          quantidade: number
          sabor1_id?: string | null
          sabor2_id?: string | null
        }
        Update: {
          adicionais_cobertura_selecionados?: Json | null
          borda_id?: string | null
          created_at?: string | null
          id?: string
          nome_produto_no_pedido?: string
          observacoes_item?: string | null
          opcionais_selecionados_item?: Json | null
          pedido_id?: string
          preco_total_item_no_pedido?: number
          preco_unitario_no_pedido?: number
          produto_id?: string | null
          quantidade?: number
          sabor1_id?: string | null
          sabor2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_sabor1_id_fkey"
            columns: ["sabor1_id"]
            isOneToOne: false
            referencedRelation: "sabores_pizza"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_sabor2_id_fkey"
            columns: ["sabor2_id"]
            isOneToOne: false
            referencedRelation: "sabores_pizza"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_nome: string
          cliente_telefone: string
          created_at: string | null
          data_hora_pedido: string | null
          endereco_bairro_id: string | null
          endereco_complemento: string | null
          endereco_rua_numero: string | null
          forma_pagamento: string
          id: string
          observacoes_cliente: string | null
          observacoes_itens_texto: string | null
          order_number: string
          status_pedido: string
          subtotal_pedido: number
          taxa_entrega_pedido: number | null
          tipo_entrega: string
          total_pedido: number
          updated_at: string | null
          upsell_sugerido_nome: string | null
          upsell_sugerido_preco: number | null
        }
        Insert: {
          cliente_nome: string
          cliente_telefone: string
          created_at?: string | null
          data_hora_pedido?: string | null
          endereco_bairro_id?: string | null
          endereco_complemento?: string | null
          endereco_rua_numero?: string | null
          forma_pagamento: string
          id?: string
          observacoes_cliente?: string | null
          observacoes_itens_texto?: string | null
          order_number: string
          status_pedido?: string
          subtotal_pedido: number
          taxa_entrega_pedido?: number | null
          tipo_entrega: string
          total_pedido: number
          updated_at?: string | null
          upsell_sugerido_nome?: string | null
          upsell_sugerido_preco?: number | null
        }
        Update: {
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string | null
          data_hora_pedido?: string | null
          endereco_bairro_id?: string | null
          endereco_complemento?: string | null
          endereco_rua_numero?: string | null
          forma_pagamento?: string
          id?: string
          observacoes_cliente?: string | null
          observacoes_itens_texto?: string | null
          order_number?: string
          status_pedido?: string
          subtotal_pedido?: number
          taxa_entrega_pedido?: number | null
          tipo_entrega?: string
          total_pedido?: number
          updated_at?: string | null
          upsell_sugerido_nome?: string | null
          upsell_sugerido_preco?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_endereco_bairro_id_fkey"
            columns: ["endereco_bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros_entrega"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          available_sizes: string[] | null
          categoria_id: string | null
          created_at: string | null
          descricao: string | null
          grupos_opcionais_ids: string[] | null
          id: string
          image_hint: string | null
          imagem_url: string | null
          ingredientes: string[] | null
          is_personalizable_pizza: boolean | null
          mostrar_no_cardapio: boolean | null
          nome: string
          onde_aparece_como_adicional: string[] | null
          preco_base: number | null
          preco_promocional: number | null
          tamanho_pizza: string | null
          tipo_pizza: string | null
          updated_at: string | null
          usar_como_adicional: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          available_sizes?: string[] | null
          categoria_id?: string | null
          created_at?: string | null
          descricao?: string | null
          grupos_opcionais_ids?: string[] | null
          id?: string
          image_hint?: string | null
          imagem_url?: string | null
          ingredientes?: string[] | null
          is_personalizable_pizza?: boolean | null
          mostrar_no_cardapio?: boolean | null
          nome: string
          onde_aparece_como_adicional?: string[] | null
          preco_base?: number | null
          preco_promocional?: number | null
          tamanho_pizza?: string | null
          tipo_pizza?: string | null
          updated_at?: string | null
          usar_como_adicional?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          available_sizes?: string[] | null
          categoria_id?: string | null
          created_at?: string | null
          descricao?: string | null
          grupos_opcionais_ids?: string[] | null
          id?: string
          image_hint?: string | null
          imagem_url?: string | null
          ingredientes?: string[] | null
          is_personalizable_pizza?: boolean | null
          mostrar_no_cardapio?: boolean | null
          nome?: string
          onde_aparece_como_adicional?: string[] | null
          preco_base?: number | null
          preco_promocional?: number | null
          tamanho_pizza?: string | null
          tipo_pizza?: string | null
          updated_at?: string | null
          usar_como_adicional?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      sabores_pizza: {
        Row: {
          ativo: boolean | null
          categoria_sabor: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          preco_grande: number
          preco_pequena: number
        }
        Insert: {
          ativo?: boolean | null
          categoria_sabor: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          preco_grande: number
          preco_pequena: number
        }
        Update: {
          ativo?: boolean | null
          categoria_sabor?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          preco_grande?: number
          preco_pequena?: number
        }
        Relationships: []
      }
      teste: {
        Row: {
          criado_em: string | null
          id: string
          nome: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          nome?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gerar_proximo_numero_pedido: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      shop_override_status_enum:
        | "automatico"
        | "forcar_aberto"
        | "forcar_fechado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      shop_override_status_enum: [
        "automatico",
        "forcar_aberto",
        "forcar_fechado",
      ],
    },
  },
} as const
