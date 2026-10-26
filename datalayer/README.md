# Exemplos de dataLayer

`user_data` vai **cru** (sem hash) para o seu servidor first-party, que normaliza e hasheia. Envie somente com consentimento. Preencha o que for conhecido; omita o que não for.

## Estrutura de `user_data`

```js
user_data: {
  external_id: 'u_839201',
  email: 'maria@exemplo.com',
  phone_number: '+55 11 99999-8888',
  address: {
    first_name: 'Maria', last_name: 'Silva',
    city: 'São Paulo', region: 'SP', postal_code: '01310-100', country: 'BR'
  },
  dob: '1990-01-31',
  gender: 'f'
}
```

## Purchase

```js
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'purchase',
  event_id: crypto.randomUUID(),
  user_data: { /* acima */ },
  ecommerce: {
    transaction_id: 'T-1001', value: 199.9, currency: 'BRL', shipping: 15, tax: 0,
    items: [{ item_id: 'SKU1', item_name: 'Camiseta', price: 92.45, quantity: 2 }]
  }
});
```

## Lead

```js
dataLayer.push({
  event: 'generate_lead',
  event_id: crypto.randomUUID(),
  user_data: { email, phone_number, address: { first_name, last_name } },
  value: 50, currency: 'BRL'
});
```

## Demais eventos

`view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `sign_up`, `search` seguem o mesmo padrão: `event`, `event_id`, `ecommerce` (ou `search_term`) e `user_data` se conhecido. Reenvie `user_data` em todos os eventos após identificar o usuário.
