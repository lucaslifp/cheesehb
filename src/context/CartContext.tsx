/* ----------------------------------------------------------------
 * src/context/CartContext.tsx
 * ----------------------------------------------------------------*/
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import type {
  ProdutoAdmin,
  CartItem,
  ContactInfo,
  UpsoldItem,
  AdicionalSelecionado,
  SaborPizza,
  Borda,
  BairroEntrega,
  AdicionalPizza as AdicionalPizzaType,
  OpcionalSelecionadoCarrinho,
  CategoriaAdmin,
} from "@/types";

import {
  getShopStatus,
  SHOP_CURRENTLY_CLOSED_MESSAGE,
} from "@/lib/shop-config";

import { toast } from "@/hooks/use-toast";
import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

/* ================================================================ */
/* helpers                                                          */
/* ================================================================ */
export const generateCartItemId = (
  produtoId: string,
  adicionaisCobertura?: AdicionalSelecionado[],
  sabor1Id?: string,
  sabor2Id?: string,
  bordaId?: string,
  opcionaisSelecionados?: OpcionalSelecionadoCarrinho[]
) => {
  const parts = [produtoId];

  if (sabor1Id) parts.push(`s1-${sabor1Id}`);
  if (sabor2Id) parts.push(`s2-${sabor2Id}`);
  if (bordaId) parts.push(`b-${bordaId}`);

  if (adicionaisCobertura?.length) {
    parts.push(
      `adc-${adicionaisCobertura
        .map((a) => `${a.id}_q${a.quantidade}`)
        .sort()
        .join("-")}`
    );
  }
  if (opcionaisSelecionados?.length) {
    parts.push(
      `ops-${opcionaisSelecionados
        .map((o) => `${o.grupo_id}_${o.item_id}_q${o.quantidade}`)
        .sort()
        .join("-")}`
    );
  }
  return parts.join("_");
};

/* ================================================================ */
/* tipo do contexto                                                 */
/* ================================================================ */
interface CartContextType {
  /* ---------- catálogo ---------- */
  produtos: ProdutoAdmin[];
  categorias: CategoriaAdmin[];
  sabores: SaborPizza[];
  bordas: Borda[];
  adicionaisPizza: AdicionalPizzaType[];
  bairrosEntrega: BairroEntrega[];

  /* ---------- helpers ----------- */
  getSaborById(id: string): SaborPizza | undefined;
  getBordaById(id: string): Borda | undefined;

  /* ---------- carrinho ---------- */
  cartItems: CartItem[];
  addToCart: (
    produto: ProdutoAdmin,
    qty?: number,
    adicionais?: AdicionalSelecionado[],
    sabor1?: string,
    sabor2?: string,
    borda?: string,
    opcionais?: OpcionalSelecionadoCarrinho[],
    obs?: string
  ) => void;
  removeFromCart(id: string): void;
  updateQuantity(id: string, qty: number): void;
  clearCart(): void;

  /* ---------- totais ------------ */
  subtotal: number;
  frete: number;
  totalAmount: number;
  totalItems: number;

  /* ---------- status loja ------- */
  isShopOpen: boolean;
  shopStatusMessage: string;
  isLoadingShopStatus: boolean;

  /* ---------- (place-holders) --- */
  /* Mantidos para compatibilidade com telas antigas. */
  upsoldItem: UpsoldItem | null;
  contactInfo: ContactInfo | null;
  addUpsoldItem(): void;
  removeUpsoldItem(): void;
  updateContactInfo(info: Partial<ContactInfo>): void;
  resetOrder(): void;

  /* ---------- outros helpers ---- */
  getAdicionalPizzaById(id: string): AdicionalPizzaType | undefined;
  getBairroById(id: string | null | undefined): BairroEntrega | undefined;
  getProdutoById(id: string): ProdutoAdmin | undefined;
  getCategoriaById(id: string): CategoriaAdmin | undefined;
  getItemOpcionalPrice(
    produtoOriginalId: string | undefined,
    precoAdicional: number
  ): number;
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined
);
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx)
    throw new Error("useCart precisa estar dentro de um <CartProvider />");
  return ctx;
};

/* ================================================================ */
/* provider                                                         */
/* ================================================================ */
export function CartProvider({ children }: { children: ReactNode }) {
  /* ---------- catálogo ---------- */
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [sabores, setSabores] = useState<SaborPizza[]>([]);
  const [bordas, setBordas] = useState<Borda[]>([]);
  const [adicionaisPizza, setAdicionaisPizza] = useState<AdicionalPizzaType[]>(
    []
  );
  const [bairrosEntrega, setBairros] = useState<BairroEntrega[]>([]);

  /* ---------- status loja ------- */
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopStatusMessage, setShopStatusMessage] = useState(
    "Verificando status da loja..."
  );
  const [isLoadingShopStatus, setIsLoadingShopStatus] = useState(true);

  /* ---------- carrinho ---------- */
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  /* ----------------------------------------------------------------
   * 1. Carregar status da loja
   * ----------------------------------------------------------------*/
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await getShopStatus();
        setIsShopOpen(status.isOpen);
        setShopStatusMessage(status.message);
      } catch {
        setIsShopOpen(false);
        setShopStatusMessage(SHOP_CURRENTLY_CLOSED_MESSAGE);
      } finally {
        setIsLoadingShopStatus(false);
      }
    };
    loadStatus();
    const id = setInterval(loadStatus, 60_000);
    return () => clearInterval(id);
  }, []);

  /* ----------------------------------------------------------------
   * 2. Carregar catálogo
   * ----------------------------------------------------------------*/
  useEffect(() => {
    const loadCatalog = async () => {
      const sb = supabaseBrowserClient;

      const [
        { data: prods },
        { data: cats },
        { data: sab },
        { data: bor },
        { data: adic },
        { data: bairros },
      ] = await Promise.all([
        sb.from("produtos").select("*").eq("ativo", true),
        sb.from("categorias").select("*"),
        sb.from("sabores_pizza").select("*").eq("ativo", true),
        sb.from("bordas_pizza").select("*").eq("ativo", true),
        sb.from("adicionais_pizza").select("*").eq("ativo", true),
        sb.from("bairros_entrega").select("*").eq("ativo", true),
      ]);

      setProdutos(prods ?? []);
      setCategorias(cats ?? []);
      setSabores(sab ?? []);
      setBordas(bor ?? []);
      setAdicionaisPizza(adic ?? []);
      setBairros(bairros ?? []);
    };
    loadCatalog();
  }, []);

  /* ----------------------------------------------------------------
   * helpers de catálogo
   * ----------------------------------------------------------------*/
  const getSaborById = useCallback(
    (id: string) => sabores.find((s) => s.id === id),
    [sabores]
  );
  const getBordaById = useCallback(
    (id: string) => bordas.find((b) => b.id === id),
    [bordas]
  );

  /* ----------------------------------------------------------------
   * Carrinho
   * ----------------------------------------------------------------*/
  const addToCart: CartContextType["addToCart"] = (
    produto,
    qty = 1,
    adicionais,
    sabor1,
    sabor2,
    borda,
    opcionais,
    obs
  ) => {
    if (!isShopOpen) {
      toast({ title: "Loja fechada", description: shopStatusMessage });
      return;
    }

    const newId = generateCartItemId(
      produto.id,
      adicionais,
      sabor1,
      sabor2,
      borda,
      opcionais
    );

    setCartItems((prev) => {
      const existing = prev.find(
        (it) =>
          generateCartItemId(
            it.produto.id,
            it.adicionais,
            it.sabor1Id,
            it.sabor2Id,
            it.bordaId,
            it.opcionaisSelecionados
          ) === newId && it.observacoesItem === obs
      );
      if (existing) {
        return prev.map((it) =>
          it === existing ? { ...it, quantity: it.quantity + qty } : it
        );
      }
      return [
        ...prev,
        {
          produto,
          quantity: qty,
          adicionais,
          sabor1Id: sabor1,
          sabor2Id: sabor2,
          bordaId: borda,
          opcionaisSelecionados: opcionais,
          observacoesItem: obs,
        },
      ];
    });
  };

  const removeFromCart = (id: string) =>
    setCartItems((prev) =>
      prev.filter(
        (it) =>
          generateCartItemId(
            it.produto.id,
            it.adicionais,
            it.sabor1Id,
            it.sabor2Id,
            it.bordaId,
            it.opcionaisSelecionados
          ) !== id
      )
    );

  const updateQuantity = (id: string, qty: number) =>
    setCartItems((prev) =>
      prev.map((it) =>
        generateCartItemId(
          it.produto.id,
          it.adicionais,
          it.sabor1Id,
          it.sabor2Id,
          it.bordaId,
          it.opcionaisSelecionados
        ) === id
          ? { ...it, quantity: qty }
          : it
      )
    );

  const clearCart = () => setCartItems([]);

  /* ----------------------------------------------------------------
   * Totais
   * ----------------------------------------------------------------*/
  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, it) =>
          sum +
          (it.produto.preco_promocional || it.produto.preco_base) * it.quantity,
        0
      ),
    [cartItems]
  );

  const frete = useMemo(() => 0, []);
  const totalAmount = subtotal + frete;
  const totalItems = useMemo(
    () => cartItems.reduce((s, it) => s + it.quantity, 0),
    [cartItems]
  );

  /* ----------------------------------------------------------------
   * Valor do contexto
   * ----------------------------------------------------------------*/
  const value = useMemo<CartContextType>(
    () => ({
      /* catálogo */
      produtos,
      categorias,
      sabores,
      bordas,
      adicionaisPizza,
      bairrosEntrega,

      /* helpers */
      getSaborById,
      getBordaById,
      getAdicionalPizzaById: (id) => adicionaisPizza.find((a) => a.id === id),
      getBairroById: (id) => bairrosEntrega.find((b) => b.id === id),
      getProdutoById: (id) => produtos.find((p) => p.id === id),
      getCategoriaById: (id) => categorias.find((c) => c.id === id),
      getItemOpcionalPrice: (_id, preco) => preco,

      /* carrinho */
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,

      /* placeholders de upsell / info (mantidos p/ compat.) */
      upsoldItem: null,
      contactInfo: null,
      addUpsoldItem: () => {},
      removeUpsoldItem: () => {},
      updateContactInfo: () => {},
      resetOrder: () => {},

      /* totais */
      subtotal,
      frete,
      totalAmount,
      totalItems,

      /* status loja */
      isShopOpen,
      shopStatusMessage,
      isLoadingShopStatus,
    }),
    [
      produtos,
      categorias,
      sabores,
      bordas,
      adicionaisPizza,
      bairrosEntrega,
      cartItems,
      subtotal,
      frete,
      totalAmount,
      totalItems,
      isShopOpen,
      shopStatusMessage,
      isLoadingShopStatus,
      getSaborById,
      getBordaById,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
