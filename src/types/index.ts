
// TODO: run `npm run gen:dbtypes` whenever the DB schema changes
import type { Database, Json } from "./supabase";

// Directly using generated types from Supabase
export type ProdutoAdmin = Database["public"]["Tables"]["produtos"]["Row"];
export type SaborPizza = Database["public"]["Tables"]["sabores_pizza"]["Row"];

// Updated Borda type - it will now directly come from the DB row which should include these prices
export type Borda = Database["public"]["Tables"]["bordas_pizza"]["Row"];
// BordaPizzaTamanhoRow is no longer needed


export type AdicionalPizza = Database["public"]["Tables"]["adicionais_pizza"]["Row"];
export type BairroEntrega = Database["public"]["Tables"]["bairros_entrega"]["Row"];
export type CategoriaAdmin = Database["public"]["Tables"]["categorias"]["Row"];
export type ClienteAdmin = Database["public"]["Tables"]["clientes"]["Row"] & {
  totalPedidos?: number;
  ultimoPedido?: string;
  fonte?: 'manual' | 'pedido';
};

export type GrupoOpcionalRow = Database["public"]["Tables"]["grupos_opcionais"]["Row"];
export type ItemOpcionalRow = Database["public"]["Tables"]["itens_opcionais"]["Row"];

export interface GrupoOpcional extends GrupoOpcionalRow {
  itens: ItemOpcionalRow[];
}
export type ItemOpcional = ItemOpcionalRow;

export type LojaConfiguracao = Database["public"]["Tables"]["loja_configuracoes"]["Row"];

// Custom types for frontend logic, not directly DB rows
export interface AdicionalSelecionado {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export interface OpcionalSelecionadoCarrinho {
  grupo_id: string;
  grupo_nome: string;
  item_id: string;
  item_nome: string;
  item_preco_adicional: number;
  quantidade: number;
}

export interface CartItem {
  produto: ProdutoAdmin;
  quantity: number;
  adicionais?: AdicionalSelecionado[];
  sabor1Id?: string;
  sabor2Id?: string;
  bordaId?: string;
  opcionaisSelecionados?: OpcionalSelecionadoCarrinho[];
  observacoesItem?: string;
}

export const paymentMethods = ["Dinheiro", "Cartão de Débito", "Cartão de Crédito", "PIX"] as const;
export type PaymentMethod = typeof paymentMethods[number];

export type TipoEntrega = 'retirada' | 'entrega';

export interface ContactInfo {
  name: string;
  phone: string;
  tipoEntrega: TipoEntrega;
  address?: string;
  bairroId?: string | null;
  complemento?: string;
  paymentMethod: PaymentMethod;
  observacoes?: string;
}

export interface UpsoldItem {
  name: string;
  price: number;
}

export const tiposProdutoParaAdicional = ['Pizza', 'Hot Dog', 'Hamburger', 'Sobremesa'] as const;
export type TipoProdutoAdicional = typeof tiposProdutoParaAdicional[number];

export const orderStatusAdmin = ['Novo', 'Em Preparo', 'Saiu para Entrega', 'Entregue', 'Cancelado'] as const;
export type OrderStatusAdmin = typeof orderStatusAdmin[number];

export interface OrderAdminItem {
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  precoTotalItem: number;
  sabores?: string;
  borda?: string;
  adicionais?: AdicionalSelecionado[];
  opcionais?: OpcionalSelecionadoCarrinho[];
  observacoesItem?: string;
}
export interface OrderAdmin {
  id: string;
  order_number: string; 
  timestamp: string;
  status: OrderStatusAdmin;
  cliente: {
    nome: string;
    telefone: string;
    endereco?: string;
    bairro?: string;
    complemento?: string;
    observacoes?: string;
  };
  itens: OrderAdminItem[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  formaPagamento: string;
  upsell?: {
      nome: string;
      preco: number;
  }
}

export type PedidoDB = Database['public']['Tables']['pedidos']['Row'];
export type PedidoItemDB = Database['public']['Tables']['pedido_itens']['Row'];

export type PedidoInsert = Database['public']['Tables']['pedidos']['Insert'];
export type PedidoItemInsert = Database['public']['Tables']['pedido_itens']['Insert'];
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert'];

export interface CriarPedidoPayload {
  contactInfo: ContactInfo;
  cartItems: CartItem[];
  upsoldItem: UpsoldItem | null;
  subtotal: number;
  frete: number;
  totalAmount: number;
}

export type ShopOverrideStatus = 'automatico' | 'forcar_aberto' | 'forcar_fechado';

export interface HorarioDia {
  diaIndex: number;
  nomeDia: string;
  aberto: boolean;
  abreAs: string;
  fechaAs: string;
}

export type ProdutoFormData = {
  nome: string;
  descricao?: string | null;
  preco_base?: number | undefined; // Changed from string, now can be undefined
  imagem_url?: string | null;
  image_hint?: string | null;
  
  is_personalizable_pizza: boolean;
  
  available_sizes?: string[] | null;
  tipo_pizza?: 'salgada' | 'doce' | null;
  
  categoria_id?: string | null;
  ativo?: boolean;
  mostrar_no_cardapio?: boolean;
  usar_como_adicional?: boolean;
  onde_aparece_como_adicional?: string[] | null;
  grupos_opcionais_ids?: string[] | null;
  
  imagem_file?: File | null;
};

export type TipoSelecaoGrupo = 'RADIO_OBRIGATORIO' | 'CHECKBOX_OPCIONAL_MULTI' | 'CHECKBOX_OBRIGATORIO_MULTI';

export const tiposSelecaoGrupoDisplay: Record<TipoSelecaoGrupo, string> = {
  RADIO_OBRIGATORIO: "Seleção Única (Obrigatório)",
  CHECKBOX_OPCIONAL_MULTI: "Múltipla Seleção (Opcional)",
  CHECKBOX_OBRIGATORIO_MULTI: "Múltipla Seleção (Obrigatório)",
};

