# 01 · Arquitetura e infraestrutura

## Componentes

| Camada | Função |
|---|---|
| **Site / dataLayer** | Emite eventos GA4 com `event_id` e `user_data` (quando conhecido) |
| **GTM Web** | Dispara Meta Pixel (browser) e envia o evento GA4 ao seu servidor |
| **GTM Server (sGTM)** | Recebe via GA4 Client, enriquece, hasheia e encaminha a GA4/Meta CAPI |
| **Meta CAPI** | Recebe eventos do servidor, deduplica com o Pixel, calcula EMQ |

## Hospedagem do container server

O setup de referência (post) usa **Stape**, região **SA East (Brasil)**, plano Free (até 10 mil solicitações/mês) e subdomínio por CNAME. Passo a passo em [04-gtm-server.md](04-gtm-server.md).

Alternativa: **Google Cloud Run** (provisionamento automático do GTM), `min-instances ≥ 2` para evitar perda de hits em cold start, região `southamerica-east1`.

## Domínio first-party

1. Crie `server.seudominio.com.br` (nome neutro; evite `analytics`, `tracking`, `gtm`).
2. DNS: **CNAME** `server` → `sab.stape.io`, com **proxy desativado** (ex.: Cloudflare em "somente DNS").
3. Use o **mesmo domínio raiz** do site para cookies first-party.
4. No GTM Web, o parâmetro `server_container_url` do Google Tag aponta para essa URL.

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
