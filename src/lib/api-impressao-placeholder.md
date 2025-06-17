
# Placeholder: API para Impressão Automática de Pedidos

Este documento descreve uma sugestão de como uma API poderia ser estruturada para permitir que um software local (rodando no computador da impressora térmica) busque novos pedidos para impressão automática.

**IMPORTANTE:** Esta é apenas uma descrição. A implementação real do backend desta API não está no escopo das capacidades atuais deste prototipador.

## 1. Endpoint para Buscar Novos Pedidos

### `GET /api/pedidos/novos-para-impressao`

Este endpoint retornaria uma lista de pedidos que são considerados "novos" e ainda não foram impressos (ou marcados como tal pelo software local).

**Parâmetros Sugeridos:**

*   `since_id` (opcional): O ID do último pedido que o software local imprimiu com sucesso. Se fornecido, a API retornaria apenas pedidos mais recentes que este ID. Isso evita reprocessar pedidos já impressos.
*   `limit` (opcional, default: 10): Número máximo de pedidos a retornar.

**Autenticação:**

*   Este endpoint precisaria ser protegido (ex: chave de API, token JWT) para garantir que apenas o software autorizado da loja possa acessá-lo.

**Resposta (Sucesso - 200 OK):**

Um array de objetos de pedido. Se não houver novos pedidos, retorna um array vazio.

```json
[
  {
    "idPedidoSistema": "pedido_xyz789", // ID único do pedido no sistema
    "numeroPedido": "#D890F1", // Número amigável para o cliente
    "dataHora": "2024-07-28T14:30:00Z", // Formato ISO 8601 UTC
    "dataHoraLocalFormatada": "28/07/2024, 11:30:00", // Para exibição
    "cliente": {
      "nome": "Ana Costa",
      "telefone": "(61) 96666-5555"
    },
    "tipoEntrega": "ENTREGA", // "ENTREGA" ou "RETIRADA_BALCAO"
    "endereco": { // Apenas se tipoEntrega === "ENTREGA"
      "logradouro": "Av. Principal, 789",
      "bairro": "Jardim América",
      "complemento": "Casa",
      "cidade": "Brasília", // Pode ser útil
      "uf": "DF",
      "cep": "70000-000" // Pode ser útil
    },
    "itens": [
      {
        "quantidade": 1,
        "nomeProduto": "Quatro Queijos (G)",
        "precoUnitario": 38.25,
        "precoTotalItem": 38.25,
        "observacoesItem": null, // Ex: "Sem cebola"
        "detalhesAdicionais": null // Ex: "Borda: Catupiry; Adicionais: Bacon"
      },
      {
        "quantidade": 1,
        "nomeProduto": "Chocolate Ao Leite (P)",
        "precoUnitario": 44.90,
        "precoTotalItem": 44.90,
        "observacoesItem": null,
        "detalhesAdicionais": null
      }
    ],
    "subtotal": 83.15,
    "taxaServico": 8.32, // (se aplicável, ex: 10% do subtotal)
    "taxaEntrega": 7.50, // (se aplicável)
    "descontos": 0.00, // (se aplicável)
    "total": 90.65,
    "formaPagamento": "Cartão de Crédito", // Ex: "Dinheiro", "Cartão de Crédito", "PIX"
    "observacoesPedidoGeral": "Troco para R$ 100,00.", // Observações gerais do pedido
    "statusAtual": "Novo" // Status do pedido no sistema
  }
  // ... mais pedidos
]
```

**Formato do Texto para Impressora Térmica:**

O software local que consome esta API seria responsável por transformar este JSON em um formato de texto simples adequado para a impressora térmica. Exemplo de como poderia ser formatado (o software local faria isso):

```plaintext
      CHEESEPIZZA - PEDIDO
---------------------------------
Pedido: #D890F1
Data: 28/07/2024, 11:30:00
Cliente: Ana Costa
Telefone: (61) 96666-5555

Tipo: ENTREGA
End: Av. Principal, 789
Bairro: Jardim América
Compl: Casa
---------------------------------
Itens:
1x Quatro Queijos (G)     R$ 38,25
1x Chocolate Ao Leite (P) R$ 44,90
---------------------------------
Subtotal:              R$ 83,15
Taxa de Entrega:       R$  7,50
Taxa de Serviço:       R$  8,32
Total:                 R$ 90,65
---------------------------------
Pagamento: Cartão de Crédito
Observações:
Troco para R$ 100,00.
---------------------------------
```

## 2. Endpoint para Verificar Configuração de Impressão Automática

### `GET /api/configuracoes/impressao`

Este endpoint permitiria que o software local verificasse se a impressão automática está habilitada no painel administrativo.

**Autenticação:** Similar ao endpoint de pedidos.

**Resposta (Sucesso - 200 OK):**

```json
{
  "impressaoAutomaticaAtiva": true // ou false
}
```

## Funcionamento do Software Local (Exemplo):

1.  Periodicamente (ex: a cada 10 segundos):
    a.  Chamar `GET /api/configuracoes/impressao`.
    b.  Se `impressaoAutomaticaAtiva` for `false`, não fazer nada e esperar o próximo ciclo.
    c.  Se `true`, chamar `GET /api/pedidos/novos-para-impressao?since_id=<ultimo_id_impresso_localmente>`.
2.  Para cada pedido recebido:
    a.  Formatar os dados do JSON para o formato de texto da impressora térmica.
    b.  Enviar para a impressora.
    c.  Se a impressão for bem-sucedida, armazenar o `idPedidoSistema` como o `ultimo_id_impresso_localmente`.
    d.  (Opcional) Fazer uma chamada para um endpoint `POST /api/pedidos/marcar-como-impresso` para notificar o sistema central que o pedido foi impresso, ajudando a evitar reimpressões e permitindo que o admin veja o status de impressão.

Este é um esboço de altoível. A implementação real envolveria considerações sobre tratamento de erros, segurança, concorrência (se múltiplos pedidos chegarem rápido), e a lógica específica do seu software de impressão.
