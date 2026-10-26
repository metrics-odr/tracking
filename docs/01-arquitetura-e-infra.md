# 01 · Arquitetura e infraestrutura

## Componentes

| Camada | Função |
|---|---|
| **Site / dataLayer** | Emite eventos GA4 com `event_id` e `user_data` (quando conhecido) |
| **GTM Web** | Dispara Meta Pixel (browser) e envia o evento GA4 ao seu servidor |
| **GTM Server (sGTM)** | Recebe via GA4 Client, enriquece, hasheia e encaminha a GA4/Meta CAPI |
| **Meta CAPI** | Recebe eventos do servidor, deduplica com o Pixel, calcula EMQ |

## Hospedagem do container server

Opções comuns: **Google Cloud Run/App Engine** (oficial, via provisionamento automático no GTM), **Stape** (gerenciado, simples de apontar domínio) ou outro provedor de containers. Recomendações:

- Produção: **mínimo 2 instâncias** (Cloud Run: `min-instances=2`) para não perder hits em cold start.
- Escolha região próxima do público (Brasil: `southamerica-east1`).
- Configure `PREVIEW_SERVER_URL` apenas para o servidor de preview, nunca como produção.

## Domínio first-party

1. Crie `track.seudominio.com.br` (ou `metrics.`, nome neutro — evite `analytics`, `tracking`, `gtm`).
2. Aponte para o serviço (registro **A/AAAA** ou **CNAME**, conforme provedor). Use **mesmo domínio raiz** do site para cookies first-party.
3. No GTM Web, em *Configuração GA4* → `server_container_url = https://track.seudominio.com.br`.
4. Se possível, use **proxy no mesmo origin** (ex.: `seudominio.com.br/metrics/`) para o carregamento do `gtm.js`/`gtag` (reduz bloqueio por adblock).

## Cookies relevantes

| Cookie | Origem | Uso |
|---|---|---|
| `_fbp` | Pixel (browser) | Browser ID → CAPI `fbp` |
| `_fbc` | Pixel / criado a partir de `?fbclid=` | Click ID → CAPI `fbc` |
| `_ga`, `_ga_<id>` | GA4 | Client ID/sessão |
| `FPID` | sGTM (Set-Cookie HTTP) | ID first-party mais durável (GA4 client) |
| `ext_id` (nosso) | `gtm-web/external-id.js` | `external_id` estável do visitante |

Cookies setados pelo servidor via cabeçalho HTTP (GA4 Client do sGTM, `FPID`) resistem melhor às restrições de ITP/Safari que cookies JS. Configure o GA4 Client com *Cookie* `Secure`, `SameSite=Lax`, domínio raiz.

## Eventos a implementar

Padrão Meta ↔ GA4:

| Meta | GA4 | Observação |
|---|---|---|
| `PageView` | `page_view` | Todo carregamento |
| `ViewContent` | `view_item` | Página de produto |
| `Search` | `search` | |
| `AddToCart` | `add_to_cart` | |
| `AddToWishlist` | `add_to_wishlist` | |
| `InitiateCheckout` | `begin_checkout` | |
| `AddPaymentInfo` | `add_payment_info` | |
| `Purchase` | `purchase` | **Obrigatório** `value` + `currency` + `event_id` |
| `Lead` | `generate_lead` | Form submit; envie email/telefone |
| `CompleteRegistration` | `sign_up` | |
| `Contact` / `Schedule` / `SubmitApplication` | eventos customizados | |
