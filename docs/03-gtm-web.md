# 03 · GTM Web

## 1. Variáveis

| Nome | Tipo | Configuração |
|---|---|---|
| `JS - event_id` | Custom JavaScript | `gtm-web/event-id.js` (lê `dlv event_id` ou gera) |
| `DLV - event_id` | Data Layer Variable | `event_id` |
| `DLV - user_data.email` / `.phone` / `.first_name` / `.last_name` / `.city` / `.state` / `.zip` / `.country` / `.dob` / `.gender` | Data Layer Variable | `user_data.*` (valores **crus**, sem hash; hash no servidor) |
| `JS - external_id` | Custom JavaScript | `gtm-web/external-id.js` |
| `Cookie - _fbp` | 1st-party cookie | `_fbp` |
| `JS - fbc` | Custom JavaScript | `gtm-web/fbc.js` (cookie `_fbc` ou cria de `?fbclid=`) |
| `Const - Pixel ID` | Constante | ID do dataset/Pixel |
| `Const - sGTM URL` | Constante | `https://track.seudominio.com.br` |

> Envie o `user_data` **cru** do navegador ao seu servidor (HTTPS first-party) e hasheie lá. Para o Pixel (browser), use Advanced Matching, que hasheia no cliente.

## 2. Tags

1. **GA4 – Configuração**
   - Measurement ID, `server_container_url = {{Const - sGTM URL}}`.
   - Campos: `user_id = {{JS - external_id}}`, `send_page_view = false` (controle por tag).
2. **GA4 – Evento** (uma tag por evento ou uma tag dinâmica com `{{Event}}`)
   - Parâmetros: `event_id = {{JS - event_id}}`, `ecommerce` (via DL), `user_data` (campos acima), `fbp`, `fbc`, `external_id`.
   - Evento `page_view` no gatilho *All Pages*.
3. **Meta Pixel – base** (template oficial/Community Template "Facebook Pixel")
   - `PageView` com `eventID = {{JS - event_id}}`.
   - Advanced Matching ligado, `external_id = {{JS - external_id}}`.
4. **Meta Pixel – eventos** (ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase, Lead…)
   - **`Event ID = {{JS - event_id}}`** (o *mesmo* valor enviado ao GA4).
   - Objeto: `content_ids`, `contents`, `content_type`, `value`, `currency`, `num_items`, `order_id`.

## 3. Gatilhos

Custom Event para cada evento do dataLayer: `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`, `generate_lead`, `sign_up`, `search`. Dispare **GA4 e Pixel no mesmo gatilho** para compartilharem o mesmo `event_id`.

## 4. Ordem e consentimento

- Consent Mode v2: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` (ver `docs/07`).
- Tags de Pixel exigem `ad_storage` concedido (Consentimento adicional nas tags).
- Dispare *Consent Initialization* antes de qualquer tag.

## 5. Preview

Use o modo **Preview** do GTM + Tag Assistant para confirmar que `event_id` é idêntico no Pixel (`eventID`) e no hit GA4.
