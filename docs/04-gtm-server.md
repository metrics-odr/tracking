# 04 · GTM Server

## 1. Clients

- **GA4 Client** (padrão): recebe `/g/collect` do GTM Web. Ative *Update cookies* e defina cookies via servidor (`FPID`).
- Opcional: *Meta Pixel Client* (Stape) para receber o Pixel via servidor.

## 2. Variáveis (Event Data)

| Variável | Event Data key |
|---|---|
| `ED - event_id` | `event_id` |
| `ED - email` | `user_data.email` (ou `user_data.sha256_email_address` se já hasheado) |
| `ED - phone` | `user_data.phone_number` |
| `ED - first_name` / `last_name` | `user_data.address.first_name` / `.last_name` |
| `ED - city` / `state` / `zip` / `country` | `user_data.address.city` / `.region` / `.postal_code` / `.country` |
| `ED - dob`, `ED - gender` | `user_data.dob`, `user_data.gender` |
| `ED - fbp`, `ED - fbc`, `ED - external_id` | `fbp`, `fbc`, `external_id` (ou `user_id`) |
| `ED - ip` | `ip_override` |
| `ED - ua` | `user_agent` |
| `ED - page_location` | `page_location` |

Se `fbp`/`fbc` não vierem no evento, leia dos cookies da requisição com a variável *Request Cookie* (`_fbp`, `_fbc`).

## 3. Tag Meta CAPI

Use a tag oficial **Facebook Conversion API** (template da Meta, na Galeria) ou a da Stape.

| Campo | Valor |
|---|---|
| Event Name Setup | *Inherit from client* (mapeia GA4→Meta) ou *Override* |
| API Access Token | Token do dataset (Events Manager → Settings → Conversions API) |
| Pixel/Dataset ID | ID do Pixel |
| Action Source | `website` |
| Test Event Code | (somente durante testes — remova depois) |
| Send all user data | Ative, se disponível |
| Gatilho | Todos os eventos GA4 mapeados (`page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`, `generate_lead`, `sign_up`) |

### Server Event Data Override (adicione todos)

| Propriedade | Valor |
|---|---|
| Event ID | `{{ED - event_id}}` |
| Event Source URL | `{{ED - page_location}}` |
| Email | `{{ED - email}}` |
| Phone | `{{ED - phone}}` |
| First Name / Last Name | `{{ED - first_name}}` / `{{ED - last_name}}` |
| City / State / Zip / Country | variáveis acima |
| Date of Birth / Gender | `{{ED - dob}}` / `{{ED - gender}}` |
| External ID | `{{ED - external_id}}` |
| FBP / FBC | `{{ED - fbp}}` / `{{ED - fbc}}` |
| Client IP Address | `{{ED - ip}}` |
| Client User Agent | `{{ED - ua}}` |
| Order ID / Value / Currency / Content IDs / Contents / Num Items | do `ecommerce.*` |

A tag oficial hasheia (SHA-256) e normaliza automaticamente os campos PII. **Não** passe valores já hasheados para campos que ela hasheia (duplo hash). Se o dado já chega hasheado, use o campo `sha256_*` correspondente.

## 4. Mapeamento de eventos GA4 → Meta

| GA4 | Meta | Mapeamento |
|---|---|---|
| `page_view` | `PageView` | |
| `view_item` | `ViewContent` | `items[]` → `contents`, `content_ids`, `content_type=product` |
| `add_to_cart` | `AddToCart` | idem |
| `begin_checkout` | `InitiateCheckout` | + `num_items`, `value` |
| `add_payment_info` | `AddPaymentInfo` | |
| `purchase` | `Purchase` | + `transaction_id` → `order_id`, `value`, `currency` |
| `generate_lead` | `Lead` | |
| `sign_up` | `CompleteRegistration` | |
| `search` | `Search` | `search_term` → `search_string` |

## 5. Persistência de identificadores no servidor

Para eventos subsequentes sem email/telefone (ex.: PageView após o login), armazene o `user_data` por `external_id`/`FPID` (Firestore no Cloud Run, ou cookie criptografado) e reinjete. Isso eleva o EMQ de eventos de topo de funil.

## 6. Segurança

- Token da CAPI **somente** no servidor (variável de ambiente/segredo); nunca no dataLayer ou no GTM Web.
- Restrinja acesso ao container e logs (contêm PII).
