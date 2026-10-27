# 03 · GTM Web (seguindo o post)

Nomes de variáveis, tags e acionadores abaixo seguem o post. Itens marcados **(+)** são acréscimos deste repo para EMQ 9+.

## 1. Variáveis

### Incorporadas (Configurar → ativar)
Click Element, Click Classes, Click ID, Click Target, Click Text, Click URL, Form Element, Form Target, Form Text, Form URL, Page URL.

### Definidas pelo usuário

| Nome | Tipo | Valor |
|---|---|---|
| `GA4 - ID da Métrica` | Permanente | `G-XXXXXXX` (GA4 → Admin → Fluxos de dados → Web) |
| `Meta Ads - Pixel ID` | Permanente | ID do Pixel/Conjunto de dados (Events Manager) |
| `Meta Ads - Click ID - _fbc` | Cookie primário | `_fbc` |
| `Meta Ads - Browser ID - _fbp` | Cookie primário | `_fbp` |
| `Server URL` | Permanente | `https://server.seudominio.com.br` |
| `Meta Ads - External ID` | Analytics Storage | *Client ID* (padrão do post). Com login/CRM, prefira o ID do usuário (doc 00, lacuna 3) |
| `Meta Ads - Event ID` | Modelo da comunidade **Event ID** (mbaersch) | Gera um ID único por evento, igual para todas as tags do mesmo evento |
| `UserData - Email` | JavaScript personalizado | [`gtm-web/userdata-email.js`](../gtm-web/userdata-email.js) |
| `UserData - Phone` | JavaScript personalizado | [`gtm-web/userdata-phone.js`](../gtm-web/userdata-phone.js) |
| `UserData - Name` | JavaScript personalizado | [`gtm-web/userdata-name.js`](../gtm-web/userdata-name.js) com `PART='first'` |
| `UserData - Last Name` **(+)** | JavaScript personalizado | mesmo arquivo com `PART='last'` |
| `UserData - City / State / Zip / Country / DOB / Gender` **(+)** | JavaScript personalizado | [`gtm-web/userdata-address-field.js`](../gtm-web/userdata-address-field.js), uma variável por campo (`FIELD`) |

> `fbc`: se o cookie `_fbc` não existir mas a URL tiver `?fbclid=`, use [`gtm-web/fbc.js`](../gtm-web/fbc.js) no lugar do cookie primário. Nunca invente `fbc` sem `fbclid`.

## 2. Tags GA4

### `GA4 - Google Tag`
- Tipo: Google Analytics (Google Tag). ID da métrica: `{{GA4 - ID da Métrica}}`.
- Parâmetros de configuração: `server_container_url = {{Server URL}}`, `send_page_view = false`, `send_lead = false`.
- Acionador: Visualizações de página (todas).

### Eventos GA4 (tipo *Google Analytics: evento do GA4*, ID `{{GA4 - ID da Métrica}}`)

| Tag | Nome do evento | Acionador | Parâmetros de evento | Propriedades do usuário |
|---|---|---|---|---|
| `GA4 - Evento - Page View` | `page_view` | Visualização de página (todas) | `event_id`, `external_id`, `fbc`, `fbp`, `server_container_url` | as mesmas do lead, quando já conhecidas |
| `GA4 - Evento - Clique no Link` | `link_click` | Cliques (todos) | `click_url`, `click_target`, `click_text`, `fbc`, `fbp`, `event_id`, `external_id`, `server_container_url` | `user_fn`, `user_email`, `user_phone` |
| `GA4 - Evento - Lead` | `lead` | Envio de formulário (todos) | `event_id`, `external_id`, `fbc`, `fbp`, `form_url`, `form_element`, `form_text`, `server_container_url` | `user_email`, `user_fn`, `user_phone` |

Valores: `event_id = {{Meta Ads - Event ID}}`, `external_id = {{Meta Ads - External ID}}`, `fbc = {{Meta Ads - Click ID - _fbc}}`, `fbp = {{Meta Ads - Browser ID - _fbp}}`, `server_container_url = {{Server URL}}`.

**(+) Propriedades do usuário adicionais** no evento `lead` (e nos demais quando conhecidas):

| Propriedade | Valor |
|---|---|
| `user_ln` | `{{UserData - Last Name}}` |
| `user_city` | `{{UserData - City}}` |
| `user_state` | `{{UserData - State}}` |
| `user_zip` | `{{UserData - Zip}}` |
| `user_country` | `{{UserData - Country}}` |
| `user_dob` | `{{UserData - DOB}}` |
| `user_gender` | `{{UserData - Gender}}` |

> Estas propriedades trafegam só até o **seu** servidor (first-party). Bloqueie o repasse ao Google Analytics no Server (doc 04, seção 6).

## 3. Meta Pixel (modelo *Meta Pixel* / facebook, na Galeria)

Uma tag por evento (`PageView`, `Lead`, e `Link Click` como evento personalizado):

| Campo | Valor |
|---|---|
| Facebook Pixel ID(s) | `{{Meta Ads - Pixel ID}}` |
| Event Name | Standard → `Lead` (ou `PageView`; Custom → `link_click`) |
| Enable Advanced Matching | marcado |
| Customer Information Data Parameters | `External ID` = `{{Meta Ads - External ID}}` **(+)** `Email`, `Phone`, `First Name`, `Last Name`, `City`, `State`, `Zip`, `Country`, `Date of Birth`, `Gender` com as variáveis `UserData - *` |
| More Settings → **Event ID** | `{{Meta Ads - Event ID}}` (o **mesmo** do GA4) |
| Acionador | O mesmo do respectivo evento GA4 (ex.: `ESM \| Lead` = envio de formulário) |

O Pixel hasheia o Advanced Matching no navegador. O servidor (Stape) hasheia o que enviar via CAPI.

## 4. Consentimento (LGPD)

Respeite o Consent Mode v2 (doc 07). Sem `ad_user_data`/`ad_storage` concedidos, não dispare Pixel nem envie `user_*`.

## 5. Teste

Tag Assistant / Preview: confirme que o `event_id` do Pixel e o do hit GA4 para o servidor (`/g/collect`) são idênticos.
