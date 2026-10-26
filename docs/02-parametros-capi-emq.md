# 02 · Parâmetros da CAPI e Event Match Quality (EMQ 9+)

> Fonte: especificação pública da Conversions API da Meta (parâmetros de servidor, `user_data`, `custom_data`) e guias de boas práticas. Confirme sempre na documentação atual da Meta, pois campos e pesos mudam.

## Como o EMQ é calculado

A Meta pontua (0–10) por evento: **quais** parâmetros de cliente chegam, a **qualidade** deles (formatados/hasheados corretamente) e o **% de eventos casados** com uma conta Meta. O EMQ é só um indicador: não mede se o dado está *correto*.

Para chegar a 9+, o caminho prático é enviar **todos** os identificadores abaixo em **todos os eventos em que o dado existir** e garantir cobertura alta de `fbp`/`fbc`/IP/UA.

## 1. Parâmetros do evento (servidor)

| Parâmetro | Obrigatório | Formato / regra |
|---|---|---|
| `event_name` | Sim | Padrão (`Purchase`…) ou custom. Igual ao do Pixel p/ dedup |
| `event_time` | Sim | Unix timestamp em **segundos**, UTC. Até 7 dias no passado |
| `event_id` | **Sim p/ dedup** | String única por ação; idêntica à do Pixel (`eventID`) |
| `event_source_url` | Sim p/ web | URL completa da página do evento |
| `action_source` | Sim | `website` (web), `system_generated`, `crm`, `chat`, `phone_call`, `email`, `physical_store`, `app`, `other` |
| `user_data` | Sim | Ver seção 2 |
| `custom_data` | Conforme evento | Ver seção 3 |
| `opt_out` | Não | `true` = não usar para otimização/atribuição |
| `data_processing_options` | Não | Ex.: `["LDU"]` (Limited Data Use) |
| `referrer_url` | Opcional | Referrer da página |

## 2. `user_data` — parâmetros de correspondência

**Hash SHA-256 (hex minúsculo)** após normalizar. **Não hasheie**: `client_ip_address`, `client_user_agent`, `fbc`, `fbp`, e IDs de app/login.

| Parâmetro | Descrição | Hash | Normalização | Exemplo (antes do hash) |
|---|---|---|---|---|
| `em` | E-mail | Sim | trim + minúsculas | `maria@exemplo.com` |
| `ph` | Telefone | Sim | só dígitos, **com código do país**, sem `+`, `00` ou zeros à esquerda | BR: `5511999998888` |
| `fn` | Nome | Sim | minúsculas, sem pontuação, UTF-8 (acentos mantidos) | `maria` |
| `ln` | Sobrenome | Sim | idem | `silva` |
| `db` | Nascimento | Sim | `YYYYMMDD` | `19900131` |
| `ge` | Gênero | Sim | `f` ou `m` | `f` |
| `ct` | Cidade | Sim | minúsculas, sem espaços, pontuação ou números | `saopaulo` |
| `st` | Estado | Sim | código de 2 letras, minúsculas | `sp` |
| `zp` | CEP | Sim | minúsculas, sem espaços/hífen. BR: 8 dígitos (EUA: 5; UK: formato area/district/sector) | `01310100` |
| `country` | País | Sim | ISO 3166-1 alpha-2, minúsculas | `br` |
| `external_id` | ID do usuário no seu sistema (login/CRM/cookie estável) | Recomendado | trim; **igual em todos os eventos e canais** | `u_839201` |
| `client_ip_address` | IP do visitante | **Não** | IPv4/IPv6; **prefira IPv6** quando disponível | `2804:14d:...` |
| `client_user_agent` | UA do navegador | **Não** | string original, sem alteração | `Mozilla/5.0 ...` |
| `fbc` | Click ID | **Não** | `fb.1.<timestamp_ms>.<fbclid>` | `fb.1.1700000000000.AbCd…` |
| `fbp` | Browser ID | **Não** | cookie `_fbp`: `fb.1.<timestamp_ms>.<random>` | `fb.1.1700000000000.1234567890` |
| `subscription_id` | ID de assinatura | Não | | |
| `fb_login_id` | ID de login Facebook | Não | | |
| `lead_id` | ID do Lead Ads | Não | Para CRM/leads de formulário nativo | |
| `madid`, `anon_id`, `idfa`… | Apps | conforme | Somente app | |

Notas importantes:

- **Valores vazios**: omita o campo; nunca envie hash de string vazia (`e3b0c442…`).
- **Hash duplo**: se o Pixel Advanced Matching ou a ferramenta já hasheia, não hasheie de novo. Hashes são 64 caracteres hex.
- **Múltiplos valores** (ex.: dois e-mails): aceita array.
- **`fbc`**: gere **apenas** com `fbclid` real na URL (cookie `_fbc`); nunca invente. Preserve o **case** do `fbclid`.
- **IP/UA**: precisam ser os do *visitante*, não do seu servidor. No sGTM, o GA4 Client repassa (`ip_override`, `user_agent`); confirme no preview.

### Prioridade para o score (maior impacto primeiro)

Segundo guias de mercado e o painel da Meta, aproximadamente:

1. `em`, `ph`, `external_id`, `fbc`, `fbp`
2. `client_ip_address`, `client_user_agent`
3. `fn`, `ln`, `ct`, `st`, `zp`, `country`, `db`, `ge`

## 3. `custom_data`

| Parâmetro | Eventos | Regra |
|---|---|---|
| `value` | Purchase (obrigatório), demais recomendado | Número decimal (ponto), sem símbolo |
| `currency` | Obrigatório com `value` | ISO 4217: `BRL` |
| `content_ids` | ViewContent, AddToCart, Purchase… | Array de strings; **mesmos IDs do catálogo** |
| `content_type` | idem | `product` ou `product_group` |
| `contents` | idem | `[{"id":"SKU1","quantity":2,"item_price":49.9}]` |
| `content_name` | opcional | |
| `content_category` | opcional | |
| `num_items` | InitiateCheckout, Purchase | inteiro |
| `order_id` | Purchase | string única; ajuda dedup/auditoria |
| `search_string` | Search | |
| `status` | CompleteRegistration | `true/false` ou string |
| `predicted_ltv` | opcional | número |
| `delivery_category` | opcional | `in_store`, `curbside`, `home_delivery` |

## 4. Checklist de campos por evento

| Evento | Mínimo | Ideal (EMQ 9+) |
|---|---|---|
| PageView | event_id, fbp, fbc*, IP, UA, source_url | + `external_id` (logado), `country` |
| ViewContent | + content_ids/type, value, currency | + `em`/`ph` se logado |
| AddToCart / InitiateCheckout | + contents, value, currency, num_items | + todos os de `user_data` conhecidos |
| Lead | `em` e/ou `ph` | `em`, `ph`, `fn`, `ln`, `ct`, `st`, `zp`, `country`, `external_id`, fbp, fbc, IP, UA |
| Purchase | value, currency, order_id, contents | **Todos** de `user_data`, inclusive `db`, `ge` quando coletados |

\* `fbc` só existe para quem veio de anúncio com `fbclid`.

## 5. Dicas de cobertura

- Capture e-mail/telefone **cedo** (checkout, formulário, login) e persista em `dataLayer`/storage para reutilizar nos eventos seguintes da sessão (com consentimento).
- No checkout, peça **telefone e CEP** (aumenta ph/zp/ct/st).
- Ative **Advanced Matching** automático no Pixel além da CAPI.
- Para eventos de CRM/offline, use `action_source=crm`/`system_generated` e inclua `lead_id`/`external_id`.
- Envie o evento **em tempo real** (a Meta recomenda em até 1h; ideal segundos).
- Não filtre por `fbc` ausente: envie o evento mesmo assim.
