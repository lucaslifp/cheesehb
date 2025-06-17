
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ProdutoAdmin, CartItem, ContactInfo, UpsoldItem, AdicionalSelecionado, SaborPizza, Borda, BairroEntrega, AdicionalPizza as AdicionalPizzaType, OpcionalSelecionadoCarrinho, CategoriaAdmin, GrupoOpcional, ItemOpcional, TipoSelecaoGrupo } from '@/types';
import { getShopStatus, SHOP_CURRENTLY_CLOSED_MESSAGE, SHOP_GENERAL_HOURS_MESSAGE, SHOP_MANUALLY_OPEN_MESSAGE } from '@/lib/shop-config';
import { toast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  upsoldItem: UpsoldItem | null;
  contactInfo: ContactInfo | null;
  sabores: SaborPizza[];
  bordas: Borda[];
  adicionaisPizza: AdicionalPizzaType[];
  bairrosEntrega: BairroEntrega[];
  produtos: ProdutoAdmin[];
  categorias: CategoriaAdmin[];
  addToCart: (
    produto: ProdutoAdmin,
    quantity?: number,
    adicionaisCobertura?: AdicionalSelecionado[],
    sabor1Id?: string,
    sabor2Id?: string,
    bordaId?: string,
    opcionaisSelecionados?: OpcionalSelecionadoCarrinho[],
    observacoesItem?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  addUpsoldItem: (item: UpsoldItem) => void;
  removeUpsoldItem: () => void;
  updateContactInfo: (info: Partial<ContactInfo>) => void;
  resetOrder: () => void;
  subtotal: number;
  frete: number;
  totalAmount: number;
  totalItems: number;
  isShopOpen: boolean;
  shopStatusMessage: string;
  isLoadingShopStatus: boolean;
  getSaborById: (id: string) => SaborPizza | undefined;
  getBordaById: (id: string) => Borda | undefined;
  getAdicionalPizzaById: (id: string) => AdicionalPizzaType | undefined;
  getBairroById: (id: string | null | undefined) => BairroEntrega | undefined;
  getProdutoById: (id: string) => ProdutoAdmin | undefined;
  getCategoriaById: (id: string) => CategoriaAdmin | undefined;
  getItemOpcionalPrice: (produtoOriginalId: string | undefined, precoAdicional: number) => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const generateCartItemId = (
  produtoId: string,
  adicionaisCobertura?: AdicionalSelecionado[],
  sabor1Id?: string,
  sabor2Id?: string,
  bordaId?: string,
  opcionaisSelecionados?: OpcionalSelecionadoCarrinho[],
): string => {
  let idParts = [produtoId];
  if (sabor1Id && sabor2Id) {
    const saboresOrdenados = [sabor1Id, sabor2Id].sort();
    idParts.push(`s1-${saboresOrdenados[0]}`);
    idParts.push(`s2-${saboresOrdenados[1]}`);
  } else if (sabor1Id) {
    idParts.push(`s1-${sabor1Id}`);
  }

  if (bordaId) {
    idParts.push(`b-${bordaId}`);
  }
  if (adicionaisCobertura && adicionaisCobertura.length > 0) {
    const adicionaisString = adicionaisCobertura
      .map(ad => `${ad.id}_q${ad.quantidade}`)
      .sort()
      .join('-');
    idParts.push(`adc-${adicionaisString}`);
  }
  if (opcionaisSelecionados && opcionaisSelecionados.length > 0) {
    const opcionaisString = opcionaisSelecionados
      .map(op => `${op.grupo_id}_${op.item_id}_q${op.quantidade}`)
      .sort()
      .join('-');
    idParts.push(`ops-${opcionaisString}`);
  }
  return idParts.join('_');
};

interface CartProviderProps {
  children: ReactNode;
  initialSabores?: SaborPizza[];
  initialBordas?: Borda[];
  initialAdicionais?: AdicionalPizzaType[];
  initialBairros?: BairroEntrega[];
  initialProdutos?: ProdutoAdmin[];
  initialCategorias?: CategoriaAdmin[];
}

export const CartProvider = ({
    children,
    initialSabores = [],
    initialBordas = [],
    initialAdicionais = [],
    initialBairros = [],
    initialProdutos = [],
    initialCategorias = []
}: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [upsoldItem, setUpsoldItem] = useState<UpsoldItem | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  const [isShopOpen, setIsShopOpen] = useState<boolean>(false); 
  const [shopStatusMessage, setShopStatusMessage] = useState<string>("Verificando status da loja...");
  const [isLoadingShopStatus, setIsLoadingShopStatus] = useState<boolean>(true);

  const [sabores, setSaboresState] = useState<SaborPizza[]>(initialSabores);
  const [bordas, setBordasState] = useState<Borda[]>(initialBordas);
  const [adicionaisPizza, setAdicionaisPizzaState] = useState<AdicionalPizzaType[]>(initialAdicionais);
  const [bairrosEntrega, setBairrosEntregaState] = useState<BairroEntrega[]>(initialBairros);
  const [produtos, setProdutosState] = useState<ProdutoAdmin[]>(initialProdutos);
  const [categorias, setCategoriasState] = useState<CategoriaAdmin[]>(initialCategorias);

  useEffect(() => {
    const updateShopStatus = async () => {
      if (!isLoadingShopStatus) setIsLoadingShopStatus(true); 
      try {
        console.log("CartContext: Calling getShopStatus from updateShopStatus");
        const status = await getShopStatus();
        console.log("CartContext - Status da loja recebido de getShopStatus:", status);
        setIsShopOpen(status.isOpen);
        setShopStatusMessage(status.message);
      } catch (error) {
        console.error("CartContext - Erro ao atualizar status da loja:", error);
        setIsShopOpen(false);
        setShopStatusMessage(SHOP_CURRENTLY_CLOSED_MESSAGE); 
      } finally {
        setIsLoadingShopStatus(false);
      }
    };
    updateShopStatus();
    const intervalId = setInterval(updateShopStatus, 60000); 
    return () => clearInterval(intervalId);
  }, []); 

  useEffect(() => { setSaboresState(initialSabores) }, [initialSabores]);
  useEffect(() => { setBordasState(initialBordas) }, [initialBordas]);
  useEffect(() => { setAdicionaisPizzaState(initialAdicionais) }, [initialAdicionais]);
  useEffect(() => { setBairrosEntregaState(initialBairros) }, [initialBairros]);
  useEffect(() => { setProdutosState(initialProdutos) }, [initialProdutos]);
  useEffect(() => { setCategoriasState(initialCategorias) }, [initialCategorias]);

  const getSaborById = useCallback((id: string) => sabores.find(s => s.id === id), [sabores]);
  const getBordaById = useCallback((id: string) => bordas.find(b => b.id === id), [bordas]);
  const getAdicionalPizzaById = useCallback((id: string) => adicionaisPizza.find(ad => ad.id === id), [adicionaisPizza]);
  const getBairroById = useCallback((id: string | null | undefined): BairroEntrega | undefined => {
    if (!id) return undefined;
    return bairrosEntrega.find(b => b.id === id);
  }, [bairrosEntrega]);
  const getProdutoById = useCallback((id: string) => produtos.find(p => p.id === id), [produtos]);
  const getCategoriaById = useCallback((id: string) => categorias.find(c => c.id === id), [categorias]);
  const getItemOpcionalPrice = useCallback((produtoOriginalId: string | undefined, precoAdicionalItemOpcional: number): number => {
    return precoAdicionalItemOpcional;
  }, []);

  const addToCart = useCallback((
    produto: ProdutoAdmin,
    quantityToAdd: number = 1,
    adicionaisCobertura?: AdicionalSelecionado[],
    sabor1Id?: string,
    sabor2Id?: string,
    bordaId?: string,
    opcionaisSelecionados?: OpcionalSelecionadoCarrinho[],
    observacoesItem?: string
  ) => {
    if (isLoadingShopStatus) {
        toast({ title: "Aguarde um momento", description: "Verificando o status da loja...", variant: "default" });
        return;
    }
    if (!isShopOpen) {
      toast({ title: "Loja Fechada", description: shopStatusMessage, variant: "destructive" });
      return;
    }
    setCartItems((prevItems) => {
      const cartItemIdToFind = generateCartItemId(produto.id, adicionaisCobertura, sabor1Id, sabor2Id, bordaId, opcionaisSelecionados);
      const existingItemIndex = prevItems.findIndex(item =>
        generateCartItemId(item.produto.id, item.adicionais, item.sabor1Id, item.sabor2Id, item.bordaId, item.opcionaisSelecionados) === cartItemIdToFind && item.observacoesItem === observacoesItem
      );
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const currentItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = { ...currentItem, quantity: currentItem.quantity + quantityToAdd };
        return updatedItems;
      } else {
        return [...prevItems, { produto, quantity: quantityToAdd, adicionais: adicionaisCobertura, sabor1Id, sabor2Id, bordaId, opcionaisSelecionados, observacoesItem }];
      }
    });
  }, [isShopOpen, shopStatusMessage, isLoadingShopStatus]);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter(item =>
        generateCartItemId(item.produto.id, item.adicionais, item.sabor1Id, item.sabor2Id, item.bordaId, item.opcionaisSelecionados) !== cartItemId
      )
    );
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          generateCartItemId(item.produto.id, item.adicionais, item.sabor1Id, item.sabor2Id, item.bordaId, item.opcionaisSelecionados) === cartItemId
            ? { ...item, quantity }
            : item
        )
      );
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setUpsoldItem(null);
  }, []);

  const addUpsoldItem = useCallback((item: UpsoldItem) => {
    if (isLoadingShopStatus) {
        toast({ title: "Aguarde", description: "Verificando status da loja..." });
        return;
    }
    if (!isShopOpen) {
      toast({ title: "Loja Fechada", description: "Não é possível adicionar itens.", variant: "destructive" });
      return;
    }
    setUpsoldItem(item);
  }, [isShopOpen, isLoadingShopStatus]);

  const removeUpsoldItem = useCallback(() => { setUpsoldItem(null); }, []);
  const updateContactInfo = useCallback((info: Partial<ContactInfo>) => {
    setContactInfo((prevInfo) => ({ ...prevInfo, ...info } as ContactInfo));
  }, []);
  const resetOrder = useCallback(() => { clearCart(); setContactInfo(null); }, [clearCart]);

  const subtotal = useMemo(() => {
    let currentSubtotal = cartItems.reduce((sum, item) => {
      let itemPrice = 0;
      const currentProduto = item.produto;
      const isGrande = currentProduto.available_sizes?.includes('Grande');

      if (currentProduto.is_personalizable_pizza && item.sabor1Id) {
        const sabor1 = getSaborById(item.sabor1Id);
        if (sabor1) {
          if (item.sabor1Id === item.sabor2Id) { 
             itemPrice = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
          } else if (item.sabor2Id && item.sabor1Id !== item.sabor2Id) { 
            const sabor2 = getSaborById(item.sabor2Id);
            if (sabor2) {
              const precoSabor1 = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
              const precoSabor2 = isGrande ? sabor2.preco_grande : sabor2.preco_pequena;
              itemPrice = (precoSabor1 / 2) + (precoSabor2 / 2);
            } else { 
              itemPrice = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
            }
          } else { 
             itemPrice = isGrande ? sabor1.preco_grande : sabor1.preco_pequena;
          }
        }
        if (item.bordaId) {
          const borda = getBordaById(item.bordaId);
          if (borda) {
            const precoBordaAdicional = isGrande ? (borda.preco_grande ?? 0) : (borda.preco_pequena ?? 0);
            if (precoBordaAdicional > 0) itemPrice += precoBordaAdicional;
          }
        }
      } else { 
        itemPrice = currentProduto.preco_promocional && currentProduto.preco_promocional > 0 
          ? currentProduto.preco_promocional 
          : currentProduto.preco_base;
      }
      const precoAdicionaisCobertura = item.adicionais?.reduce((acc, ad) => {
          const adicionalInfo = adicionaisPizza.find(ap => ap.id === ad.id);
          return acc + ((adicionalInfo?.preco || 0) * ad.quantidade);
      }, 0) || 0;
      itemPrice += precoAdicionaisCobertura;
      const precoOpcionaisSelecionados = item.opcionaisSelecionados?.reduce((acc, op) => {
        return acc + (op.item_preco_adicional * op.quantidade);
      }, 0) || 0;
      itemPrice += precoOpcionaisSelecionados;
      return sum + (itemPrice * item.quantity);
    }, 0);
    if (upsoldItem) { currentSubtotal += upsoldItem.price; }
    return currentSubtotal;
  }, [cartItems, upsoldItem, getSaborById, getBordaById, adicionaisPizza]);

  const frete = useMemo(() => {
    if (contactInfo?.tipoEntrega === 'entrega' && contactInfo.bairroId) {
      const bairro = getBairroById(contactInfo.bairroId);
      return bairro ? bairro.taxa_entrega : 0;
    }
    return 0;
  }, [contactInfo, getBairroById]);

  const totalAmount = useMemo(() => subtotal + frete, [subtotal, frete]);
  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const contextValue = useMemo(() => ({
    cartItems, upsoldItem, contactInfo, sabores, bordas, adicionaisPizza, bairrosEntrega, produtos, categorias,
    addToCart, removeFromCart, updateQuantity, clearCart, addUpsoldItem, removeUpsoldItem, updateContactInfo, resetOrder,
    subtotal, frete, totalAmount, totalItems, isShopOpen, shopStatusMessage, isLoadingShopStatus,
    getSaborById, getBordaById, getAdicionalPizzaById, getBairroById, getProdutoById, getCategoriaById, getItemOpcionalPrice,
  }), [
    cartItems, upsoldItem, contactInfo, sabores, bordas, adicionaisPizza, bairrosEntrega, produtos, categorias,
    addToCart, removeFromCart, updateQuantity, clearCart, addUpsoldItem, removeUpsoldItem, updateContactInfo, resetOrder, subtotal, frete,
    totalAmount, totalItems, isShopOpen, shopStatusMessage, isLoadingShopStatus,
    getSaborById, getBordaById, getAdicionalPizzaById, getBairroById, getProdutoById, getCategoriaById, getItemOpcionalPrice
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};
