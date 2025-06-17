
import type { CategoriaAdmin, ProdutoAdmin, IngredienteAdicional, SaborPizza, Borda, Bairro, GrupoOpcional, ItemOpcional, OrderAdmin, ClienteAdmin } from '@/types';
import parse from 'date-fns/parse'; 

// CATEGORIAS - Agora gerenciadas pela API e banco de dados.
// export const sampleCategoriasAdmin: CategoriaAdmin[] = []; // Removido

// SABORES DE PIZZA - Agora gerenciadas pela API e banco de dados.
// export const sampleSaboresPizzaAdmin: SaborPizza[] = []; // Removido

// BORDAS DE PIZZA - Agora gerenciadas pela API e banco de dados.
// export const sampleBordasAdmin: Borda[] = []; // Removido

// BAIRROS - Agora gerenciados pela API e banco de dados.
// export const sampleBairrosAdmin: Bairro[] = []; // Removido

// GRUPOS OPCIONAIS - Agora gerenciados pela API e banco de dados.
// export const sampleGruposOpcionaisAdmin: GrupoOpcional[] = []; // Removido

// PRODUTOS - Agora gerenciados pela API e banco de dados.
// A lista de produtos na homepage virá da API.
// Modais podem precisar de uma forma de buscar produtos específicos (ex: bebidas) pela API.
// export const sampleProdutosAdmin: ProdutoAdmin[] = []; // Removido

// INGREDIENTES ADICIONAIS (COBERTURA) - Agora gerenciados pela API e banco de dados.
// export const sampleIngredientesAdicionaisAdmin: IngredienteAdicional[] = []; // Removido


// ===== DADOS DE EXEMPLO PARA PEDIDOS E CLIENTES (AINDA USADOS EM SIMULAÇÕES) =====

// Lista de pedidos de exemplo
const rawSampleOrders: OrderAdmin[] = [
  {
    id: '#NWPD001',
    timestamp: '10/08/2024, 10:30:00',
    status: 'Novo',
    cliente: {
      nome: 'Arthur Dent',
      telefone: '(11) 91234-5678',
      endereco: 'Rua da Toalha, 42',
      bairro: 'Magrathea',
      observacoes: 'Não entre em pânico!',
    },
    itens: [
      { nomeProduto: 'Pizza Meio a Meio Grande', sabores: "Calabresa / Quatro Queijos", borda: "Catupiry", quantidade: 1, precoUnitario: 50.00, precoTotalItem: 60.00, adicionais: [{ nome: "Bacon Extra", quantidade: 1, preco: 5.00}] },
      { nomeProduto: 'Coca-Cola 2L', quantidade: 1, precoUnitario: 12.00, precoTotalItem: 12.00 },
    ],
    subtotal: 72.00,
    taxaEntrega: 5.00,
    total: 77.00,
    formaPagamento: 'Dinheiro',
  },
  {
    id: '#NWPD002',
    timestamp: '10/08/2024, 11:15:00',
    status: 'Em Preparo',
    cliente: {
      nome: 'Zaphod Beeblebrox',
      telefone: '(21) 98765-4321',
      endereco: 'Coração de Ouro, Suíte Presidencial',
      bairro: 'Espaço Sideral',
    },
    itens: [
      { nomeProduto: 'House Blend Hambúrguer Artesanal', quantidade: 2, precoUnitario: 45.00, precoTotalItem: 90.00, observacoesItem: "Extra queijo!" },
      { nomeProduto: 'Fanta Laranja 2 litros', quantidade: 1, precoUnitario: 10.00, precoTotalItem: 10.00 },
    ],
    subtotal: 100.00,
    taxaEntrega: 15.00,
    total: 115.00,
    formaPagamento: 'PIX',
  },
  {
    id: '#NWPD003',
    timestamp: '09/08/2024, 20:00:00',
    status: 'Entregue',
    cliente: {
      nome: 'Trillian Astra',
      telefone: '(31) 99988-7766',
    }, 
    itens: [
      { nomeProduto: 'Pizza Hot Dog (G)', sabores: "Pizza Hot Dog (Inteira)", quantidade: 1, precoUnitario: 38.25, precoTotalItem: 38.25 },
      { nomeProduto: 'Guaraná Antárctica 310ml', quantidade: 3, precoUnitario: 6.00, precoTotalItem: 18.00 },
    ],
    subtotal: 56.25,
    taxaEntrega: 0.00,
    total: 56.25,
    formaPagamento: 'Cartão de Débito',
  },
   {
    id: '#NWPD004',
    timestamp: '11/08/2024, 12:00:00',
    status: 'Novo',
    cliente: {
      nome: 'Marvin Android',
      telefone: '(41) 91122-3344',
      endereco: 'Servidor Principal, Baía 3',
      bairro: 'Sirius Cybernetics Corp.',
      observacoes: 'Não me peça para ser feliz com o pedido.',
    },
    itens: [
      { nomeProduto: 'Dog Completo (Com Catupiry)', quantidade: 1, precoUnitario: 32.90, precoTotalItem: 32.90 },
      { nomeProduto: 'Sprite Limão 310ml', quantidade: 1, precoUnitario: 6.50, precoTotalItem: 6.50 },
    ],
    subtotal: 39.40,
    taxaEntrega: 3.00,
    total: 42.40,
    formaPagamento: 'Cartão de Crédito',
  },
  {
    id: '#NWPD005',
    timestamp: '11/08/2024, 13:00:00',
    status: 'Saiu para Entrega',
    cliente: {
      nome: 'Ford Prefect',
      telefone: '(51) 94455-6677',
      endereco: 'Betelgeuse V, Setor ZZ9',
      bairro: 'Guia do Mochileiro',
    },
    itens: [
      { nomeProduto: 'Calabresa Cheese (G)', sabores: "Calabresa Cheese (Inteira)", borda: "Cheddar", quantidade: 1, precoUnitario: 46.75, precoTotalItem: 64.75 },
      { nomeProduto: 'Fanta Uva 310ml', quantidade: 2, precoUnitario: 6.50, precoTotalItem: 13.00 },
    ],
    subtotal: 77.75,
    taxaEntrega: 7.00,
    total: 84.75,
    formaPagamento: 'PIX',
  },
];

const chronologicallySortedOrders = [...rawSampleOrders].sort((a, b) => {
  const dateA = parse(a.timestamp, 'dd/MM/yyyy, HH:mm:ss', new Date());
  const dateB = parse(b.timestamp, 'dd/MM/yyyy, HH:mm:ss', new Date());
  return dateA.getTime() - dateB.getTime();
});

export const initialSampleOrders: OrderAdmin[] = chronologicallySortedOrders.map(order => ({
  ...order,
}));

// CLIENTES - Será inicializado como vazio em `/admin/clientes/page.tsx`
// A lógica abaixo pode ser usada no futuro quando a API de clientes for construída
// para gerar uma lista inicial baseada em pedidos, se necessário.
const uniqueClientesMap = new Map<string, ClienteAdmin>();
initialSampleOrders.forEach((order, index) => {
  if (order.cliente && order.cliente.telefone) {
    if (!uniqueClientesMap.has(order.cliente.telefone)) {
      uniqueClientesMap.set(order.cliente.telefone, {
        id: `cliente_${order.id.replace(/\W/g, '')}_${index}`, 
        nome: order.cliente.nome,
        telefone: order.cliente.telefone,
        dataCadastro: new Date().toLocaleDateString('pt-BR'), 
        totalPedidos: 1,
        ultimoPedido: order.timestamp.split(',')[0] 
      });
    } else {
      const existingClient = uniqueClientesMap.get(order.cliente.telefone)!;
      existingClient.totalPedidos = (existingClient.totalPedidos || 0) + 1;
      const existingLastOrderDate = parse(existingClient.ultimoPedido || '01/01/1970', 'dd/MM/yyyy', new Date());
      const currentOrderDate = parse(order.timestamp.split(',')[0], 'dd/MM/yyyy', new Date());
      if (currentOrderDate > existingLastOrderDate) {
        existingClient.ultimoPedido = order.timestamp.split(',')[0];
      }
    }
  }
});
export const sampleClientesAdmin: ClienteAdmin[] = Array.from(uniqueClientesMap.values()).sort((a,b) => a.nome.localeCompare(b.nome));
