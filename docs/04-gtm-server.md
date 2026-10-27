# 04 · GTM Server + Stape (seguindo o post)

## 1. Container e hospedagem (Stape)

1. GTM → conta do Web → **Administrador → +** → novo container tipo **Server** (nome do subdomínio, ex.: `server.seudominio.com.br`).
2. Ao abrir: **Provisionar manualmente o servidor de tags** → copie o código de provisionamento.
3. Stape ([stape.io/pt/sign-up](https://stape.io/pt/sign-up)) → criar container: nome igual ao do Server, conectar ao GTM (conta + container **Server**), **Server location = SA East (Brazil)**, plano **Free** (até 10 mil solicitações/mês; pagos a partir de ~R$ 100).
4. Stape → Domains → **+ Add new** → subdomínio → *Manually* → Next. Anote os registros pedidos.
5. No DNS do domínio: **CNAME**, host `server`, destino `sab.stape.io`, **proxy desativado** (se for Cloudflare, nuvem cinza).
6. Stape → *Verify your subdomain* (minutos a horas).
7. GTM Server → Administrador → Configurações do contêiner → **URL do servidor de tags** = `https://server.seudominio.com.br` (use a URL `*.stape.io` provisoriamente, mas troque após validar o domínio).

> Alternativa à Stape: Google Cloud Run (provisionamento automático do GTM), `min-instances ≥ 2` e região `southamerica-east1`. O restante deste documento não muda.

## 2. Client e acionadores

- **Client**: GA4 (padrão, já vem criado). Ele recebe o hit `/g/collect` do GTM Web.
- **Acionadores** (tipo *Evento personalizado*, nome = nome exato do evento no Web):

| Acionador | Nome do evento |
|---|---|
| `GA4 - All Events` | `.*` com **Usar correspondência de regex** marcado |
| `GA4 - Page View` | `page_view` |
| `GA4 - Link Click` | `link_click` |
| `GA4 - Lead` | `lead` |

## 3. Variáveis

Ative todas as incorporadas. Variáveis definidas pelo usuário:

| Nome | Tipo | Chave / valor |
|---|---|---|
| `Meta Ads - Pixel ID` | Permanente | ID do Pixel |
| `Meta Ads - API Token` | Permanente | Token da CAPI (Events Manager → Configurações → API de Conversões → gerar token). Fica **só aqui** |
| `Event ID` | Dados do evento | `event_id` |
| `fbc` | Dados do evento | `fbc` |
| `fbp` | Dados do evento | `fbp` |
| `Meta Ads - External ID` | Dados do evento | `external_id` |
| `User Data - Email` | Dados do evento | `user_properties.user_email` |
| `User Data - Phone` | Dados do evento | `user_properties.user_phone` |
| `User Data - First Name` | Dados do evento | `user_properties.user_fn` |
| `User Data - Last Name` **(+)** | Dados do evento | `user_properties.user_ln` |
| `User Data - City` / `State` / `Zip` / `Country` **(+)** | Dados do evento | `user_properties.user_city` / `user_state` / `user_zip` / `user_country` |
| `User Data - DOB` / `Gender` **(+)** | Dados do evento | `user_properties.user_dob` / `user_gender` |

> Os caminhos `user_properties.*` são os que o GA4 Client usa para propriedades do usuário. Confirme em **Preview → evento → Event Data** e ajuste se o seu aparecer diferente.

## 4. Tag *Facebook Conversion API* (modelo da Stape, na Galeria)

Uma tag por evento (`Meta Ads - Evento - Page View`, `... - Lead`, `... - Link Click`), acionador = o `GA4 - *` correspondente.

| Campo | Valor |
|---|---|
| Event Name Setup Method | **Override** → Standard → `PageView` / `Lead` (Link Click: Custom → `link_click`) |
| Action Source | `Website` |
| Facebook Pixel ID | `{{Meta Ads - Pixel ID}}` |
| API Access Token | `{{Meta Ads - API Token}}` |
| Test ID | só durante testes (Events Manager → Test Events). **Remova antes de publicar** |
| Override the cookie domain | False (ajuste se o site usar domínio diferente do servidor) |
| Generate _fbp cookie if it does not exist | marcado |
| Use HttpOnly cookies for _fbc and _fbp | desmarcado (o Pixel no navegador precisa ler) |
| Enable Event Enhancement | marcado |
| **Server Event Data Override** → Automap Server Event Data | marcado |
| ↳ Property **Event ID** | `{{Event ID}}` |
| **User Data** → Automap User Data | marcado |
| ↳ Email / Phone / First Name | `{{User Data - Email}}` / `{{User Data - Phone}}` / `{{User Data - First Name}}` |
| ↳ Click ID / Browser ID / External ID | `{{fbc}}` / `{{fbp}}` / `{{Meta Ads - External ID}}` |
| ↳ **(+)** Last Name, City, State, Zip, Country, Date of Birth, Gender | as variáveis `User Data - *` acima |
| Tag Execution Consent Settings | exigir consentimento de publicidade |

A tag **normaliza e hasheia** os campos que precisam e aceita dados já hasheados. Não hasheie antes (hash duplo). O IP e o User-Agent do visitante vêm da requisição (confirme no Preview que `client_ip_address` não é o IP da Stape).

Parâmetros de `custom_data` para comércio (`Purchase` etc.): `value`, `currency`, `content_ids`, `contents`, `content_type`, `num_items`, `order_id` na seção *Custom Data*. Veja [02](02-parametros-capi-emq.md).

## 5. Tag GA4 no Server

Tag *Google Analytics: GA4* com `{{GA4 - ID da Métrica}}`, acionador `GA4 - All Events`.

## 6. Não envie PII ao Google Analytics

Como as propriedades `user_*` chegam ao Server junto do evento, a tag GA4 do Server pode encaminhá-las ao Google Analytics, o que a política do GA4 proíbe (e-mail, telefone e nome em texto puro). Solução:

1. GTM Server → **Transformações → Nova → Excluir parâmetros** (*Exclude parameters*).
2. Excluir: `user_properties` (ou cada `user_*`) e, se preferir, `fbc`/`fbp`/`external_id`.
3. **Aplique a transformação somente à tag GA4** (e à do Google Ads, se for o caso), **não** à tag da Meta.

Teste no Preview do Server: a tag da Meta deve ver o `user_data`; a tag GA4 não.

## 7. Dica para mais EMQ: persistência no servidor

Eventos sem formulário (page_view) não têm e-mail/telefone. Além do `sessionStorage` do Web, é possível guardar o `user_data` por `external_id` no servidor (ex.: Firestore via Stape Store) e reinjetá-lo nos próximos eventos. Eleva o EMQ de topo de funil, sempre com consentimento e prazo de retenção definido.
