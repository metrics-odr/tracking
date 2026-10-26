# 05 · Deduplicação Pixel × CAPI

A Meta deduplica eventos do Pixel e da CAPI quando têm **mesmo `event_name` e mesmo `event_id`** (se `event_id` faltar, tenta combinar `external_id` + `fbp`, de forma menos confiável). O evento do navegador é mantido quando os dois chegam em janela curta (≈5 min na prática; a janela total de dedup é de até 48h).

## Regras

1. Gere o `event_id` **uma vez por ação**, no `dataLayer` (UUID v4 ou `timestamp_random`).
2. O **mesmo** valor vai para: Pixel (`eventID`), hit GA4 (parâmetro `event_id`) e tag CAPI (`Event ID`).
3. Nunca use valor constante, `{{Random Number}}` calculado separadamente em cada tag, nem o `gtm.uniqueEventId` dissociado entre tags.
4. `event_name` idêntico (`Purchase` ≠ `purchase`).
5. Em `Purchase`, também envie `order_id` (útil para auditar).
6. Eventos só de servidor (CRM, webhooks): sem Pixel ⇒ sem dedup necessária, mas mantenha `event_id` único para reentrega idempotente.

## Implementação

```js
// dataLayer push com event_id fixo para todo o fluxo
dataLayer.push({
  event: 'purchase',
  event_id: 'a1b2c3d4-…',
  ecommerce: { transaction_id: 'T-1001', value: 199.9, currency: 'BRL', items: [...] }
});
```

Veja `gtm-web/event-id.js` e `datalayer/`.

## Verificação

1. **Events Manager → Dataset → Test Events**: o evento do navegador e do servidor devem aparecer com o rótulo *Deduplicated*.
2. **Overview → evento → "Deduplicação"**: percentual de eventos Pixel e CAPI deduplicados (alvo > 90%).
3. Em **Diagnostics**, procure alertas de `event_id` ausente/divergente.
4. No GTM Preview (web e server), compare `event_id` do Pixel e da requisição ao servidor.

## Erros comuns

| Sintoma | Causa provável |
|---|---|
| Eventos duplicados no Meta (contagem 2×) | `event_id` diferente ou ausente em um dos canais |
| 0% dedup do Pixel | Pixel sem `eventID` |
| Dedup só da CAPI | Pixel dispara em gatilho distinto do GA4 |
| Purchases dobrados em recarga da thank-you page | Falta de guarda por `transaction_id` (use cookie/sessionStorage) |
