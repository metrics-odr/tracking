# Setup completo: GTM Web + GTM Server (Stape) + GA4 + Meta Pixel/CAPI

Guia para **aplicar em ordem**. Cada fase termina com um ✅ **Checkpoint**: só avance quando ele passar. A ordem foi pensada para evitar espera e retrabalho (ex.: o DNS começa cedo, variáveis vêm antes das tags, o GA4 vem antes do Meta porque o Meta no servidor é acionado pelo evento GA4).

> Base: [post do setup server-side](https://eduardomezzavilla.com.br/setup-de-trackeamento-server-side/) + documentação oficial da Meta, completado para EMQ ≥ 9. Contexto e justificativas em [docs/](docs/). Itens **(+)** são acréscimos ao post.

## Visão geral da ordem

| Fase | O que fazer | Por que nesta ordem |
|---|---|---|
| 0 | Reunir acessos e IDs | Evita parar no meio para procurar um ID |
| 1 | Criar containers, Stape e **iniciar o DNS** | O DNS demora; propaga enquanto você segue |
| 2 | Instalar o GTM Web no site | Base de tudo; valida com o Tag Assistant |
| 3 | Variáveis (Web e Server) | Toda tag depende delas |
| 4 | GA4 Web | Origem dos eventos enviados ao servidor |
| 5 | GA4 Server | Recebe, e dispara o Meta no servidor |
| 6 | Meta Pixel (Web) | Lado navegador, com o mesmo `event_id` |
| 7 | Meta CAPI (Server) | Lado servidor, com `user_data` completo |
| 8 | Teste, deduplicação, EMQ e publicação | Só publique com tudo validado |

```
Site → GTM Web → GA4 tag ──(server_container_url)──► GTM Server ─► GA4 Client ─┬► Tag GA4
              └► Meta Pixel (navegador) ─────────────────────────┐            └► Tag Facebook CAPI ─┐
                                                       dedup: event_name + event_id ◄────────────────┘
                                                                  ▼
                                                              Meta Events Manager
```

---

## Fase 0 · Pré-requisitos

Tenha em mãos (marque conforme reunir):

- [ ] Conta Google com acesso ao **Google Tag Manager**
- [ ] Propriedade **GA4** com fluxo de dados Web → anote o **ID da métrica** (`G-XXXXXXXX`): *GA4 → Administrador → Fluxos de dados → Web*
- [ ] Acesso ao **Gerenciador de Eventos do Meta** → anote o **ID do Pixel / Conjunto de dados**
- [ ] **Token da API de Conversões**: *Events Manager → seu conjunto de dados → Configurações → API de Conversões → Gerar token de acesso*. Guarde em local seguro; ele vai **só** no container Server
- [ ] Acesso ao **DNS** do domínio (e a quem edita o site, se não for você)
- [ ] Conta na **Stape** (<https://stape.io/pt/sign-up>), usando o e-mail do projeto
- [ ] Decidir o subdomínio do servidor, ex.: `server.seudominio.com.br` (nome neutro; evite `analytics`, `tracking`, `gtm`)
- [ ] Ferramentas: extensão **Tag Assistant** (Chrome) e o **Test Events** do Meta aberto em outra aba
- [ ] Definir como o consentimento será coletado (CMP/banner). Veja a Fase 8 e [docs/07](docs/07-lgpd-consentimento.md)

---

## Fase 1 · Containers e infraestrutura (inicie o DNS cedo)

### 1.1 Criar o container GTM **Web**
1. Abra <https://tagmanager.google.com/#/admin/accounts/create>.
2. Dê nome à conta, escolha o país, e crie o container tipo **Web**. Aceite os termos.
3. Mantenha à mão os dois snippets de instalação (usados na Fase 2).

### 1.2 Criar o container GTM **Server** (na mesma conta)
1. Abra o container Web → aba **Administrador** → botão **+** → novo container.
2. Nome: o subdomínio escolhido (`server.seudominio.com.br`). Tipo: **Server**. Criar.
3. Na tela seguinte, clique em **Provisionar manualmente o servidor de tags** e **copie o código de provisionamento** (*container config*).

> Atenção: as telas do GTM Web e do Server são muito parecidas. Sempre confira o nome do container no topo antes de editar.

### 1.3 Criar o container na **Stape**
1. Stape → **Create container**.
2. **Nome**: igual ao do container Server. Conecte ao GTM (autorize a Stape) e selecione a **conta** e o container **Server**.
3. **Server location**: **SA East (Brazil)**.
4. **Create Container** → plano **Free** (até 10 mil solicitações/mês; pagos a partir de ~R$ 100). Para produção com volume, planeje o plano pago.

### 1.4 Configurar o subdomínio na Stape e **iniciar o DNS agora**
1. No container da Stape → **Domains → +Add new** → informe o subdomínio → **Manually** → **Next**.
2. A Stape mostra o registro a criar. No painel de DNS do domínio, **Adicionar registro**:

   | Tipo | Host/Nome | Valor/Destino | Proxy |
   |---|---|---|---|
   | CNAME | `server` (só o prefixo; o provedor completa o domínio) | `sab.stape.io` | **Desativado** (ex.: Cloudflare em "somente DNS", nuvem cinza) |

   (Use exatamente os valores que a Stape exibir para o seu container.)
3. Volte à Stape e clique em **Verify your subdomain**. Pode levar de minutos a horas.

⏳ **Não espere.** Siga para as Fases 2 e 3 enquanto o DNS propaga.

### 1.5 Informar a URL do servidor no GTM Server
1. GTM Server → **Administrador → Configurações do contêiner → Adicionar URL**.
2. Cole a URL do servidor de tags. Se o DNS ainda não validou, use temporariamente a URL `*.stape.io` do seu container (aparece na Stape) e **troque pela do seu subdomínio depois**.
3. Salve, reabra as configurações e confirme que a URL ficou registrada.

✅ **Checkpoint 1:** existem o container Web e o container Server (mesma conta); o container Stape está criado e conectado; o CNAME foi criado; a URL do servidor está salva no GTM Server.

---

## Fase 2 · Instalar o GTM Web no site

1. No GTM Web: **Administrador → Instalar o Google Tag Manager**. Copie os dois snippets.
2. Cole o 1º snippet o mais alto possível no `<head>` e o 2º logo após a abertura do `<body>` em **todas as páginas** (WordPress/Elementor: plugin de código no cabeçalho/corpo, ou o tema).
3. Valide com a extensão **Tag Assistant**: abra o site; deve aparecer o ícone do GTM e o ID `GTM-XXXXXXX` correto.

✅ **Checkpoint 2:** Tag Assistant mostra o container Web carregando em todas as páginas-chave (home, página de formulário, obrigado).

---

## Fase 3 · Variáveis essenciais

Criar **todas** antes das tags. Em *Variáveis*, use **Nova** (definidas pelo usuário). Nomes iguais aos abaixo, pois o guia os referencia.

### 3.1 Container **Web**

**Incorporadas** (Variáveis → *Configurar*, ative): Click Element, Click Classes, Click ID, Click Target, Click Text, Click URL, Form Element, Form Target, Form Text, Form URL, Page URL.

**Definidas pelo usuário:**

| # | Nome | Tipo | Configuração |
|---|---|---|---|
| 1 | `GA4 - ID da Métrica` | Permanente | `G-XXXXXXXX` |
| 2 | `Meta Ads - Pixel ID` | Permanente | ID do Pixel |
| 3 | `Server URL` | Permanente | `https://server.seudominio.com.br` |
| 4 | `Meta Ads - Click ID - _fbc` | Cookie primário | Nome do cookie: `_fbc` (variante: [`gtm-web/fbc.js`](gtm-web/fbc.js), que cria o `_fbc` a partir de `?fbclid=`) |
| 5 | `Meta Ads - Browser ID - _fbp` | Cookie primário | Nome do cookie: `_fbp` |
| 6 | `Meta Ads - External ID` | Analytics Storage | Selecione **Client ID**. (Com login/CRM, prefira o ID do usuário) |
| 7 | `Meta Ads - Event ID` | Modelo da comunidade | Nova variável → *Descubra mais tipos na Galeria* → pesquise **Event ID** (autor *mbaersch*) → **Adicionar ao espaço de trabalho** → Adicionar → salvar → crie a variável |
| 8 | `UserData - Email` | JavaScript personalizado | Código de [`gtm-web/userdata-email.js`](gtm-web/userdata-email.js) |
| 9 | `UserData - Phone` | JavaScript personalizado | [`gtm-web/userdata-phone.js`](gtm-web/userdata-phone.js) |
| 10 | `UserData - Name` | JavaScript personalizado | [`gtm-web/userdata-name.js`](gtm-web/userdata-name.js) com `PART = 'first'` |
| 11 (+) | `UserData - Last Name` | JavaScript personalizado | mesmo arquivo com `PART = 'last'` |
| 12 (+) | `UserData - City`, `- State`, `- Zip`, `- Country`, `- DOB`, `- Gender` | JavaScript personalizado | [`gtm-web/userdata-address-field.js`](gtm-web/userdata-address-field.js), uma variável por campo (muda só `FIELD`) |

Observações:
- As variáveis `UserData - *` leem o formulário enviado (`{{Form Element}}`), por isso só têm valor no evento de envio. O script guarda o dado na sessão para reaproveitar nos eventos seguintes (use só com consentimento).
- O `external_id` usa o Client ID do GA4 por padrão. Ele identifica o navegador, não a pessoa.

### 3.2 Container **Server**

**Incorporadas:** ative todas.

**Definidas pelo usuário:**

| # | Nome | Tipo | Valor / chave |
|---|---|---|---|
| 1 | `GA4 - ID da Métrica` | Permanente | `G-XXXXXXXX` |
| 2 | `Meta Ads - Pixel ID` | Permanente | ID do Pixel |
| 3 | `Meta Ads - API Token` | Permanente | token gerado na Fase 0 |
| 4 | `Event ID` | Dados do evento | `event_id` |
| 5 | `fbc` | Dados do evento | `fbc` |
| 6 | `fbp` | Dados do evento | `fbp` |
| 7 | `Meta Ads - External ID` | Dados do evento | `external_id` |
| 8 | `User Data - Email` | Dados do evento | `user_properties.user_email` |
| 9 | `User Data - Phone` | Dados do evento | `user_properties.user_phone` |
| 10 | `User Data - First Name` | Dados do evento | `user_properties.user_fn` |
| 11 (+) | `User Data - Last Name` | Dados do evento | `user_properties.user_ln` |
| 12 (+) | `User Data - City` / `State` / `Zip` / `Country` / `DOB` / `Gender` | Dados do evento | `user_properties.user_city` / `user_state` / `user_zip` / `user_country` / `user_dob` / `user_gender` |

A lógica: cada **parâmetro** que a tag GA4 do Web envia vira um **Dado do evento** que estas variáveis leem. Se o caminho (`user_properties.*`) aparecer diferente no seu Preview (Fase 5), ajuste a chave.

✅ **Checkpoint 3:** variáveis criadas nos dois containers, sem erros de nome. Se o DNS já validou, troque agora a URL temporária pela do seu subdomínio (passo 1.5).

---

## Fase 4 · GA4 no **Web** (instalação + eventos)

Em *Tags → Nova*. Todas as tags de evento usam `ID da métrica = {{GA4 - ID da Métrica}}`.

### 4.1 Tag `GA4 - Google Tag` (global)
- Tipo: **Google Analytics → Google Tag**. ID: `{{GA4 - ID da Métrica}}`.
- **Parâmetros de configuração:**

  | Parâmetro | Valor |
  |---|---|
  | `server_container_url` | `{{Server URL}}` |
  | `send_page_view` | `false` |
  | `send_lead` | `false` |

- Acionador: **Visualizações de página (todas)**.

### 4.2 Tag `GA4 - Evento - Page View`
- Tipo: **Google Analytics: evento do GA4**. Nome do evento: `page_view`.
- **Parâmetros de evento:** `event_id` = `{{Meta Ads - Event ID}}`, `external_id` = `{{Meta Ads - External ID}}`, `fbc` = `{{Meta Ads - Click ID - _fbc}}`, `fbp` = `{{Meta Ads - Browser ID - _fbp}}`, `server_container_url` = `{{Server URL}}`.
- Acionador: **Visualização de página (todas)**.

### 4.3 Tag `GA4 - Evento - Clique no Link`
- Nome do evento: `link_click`.
- **Parâmetros:** `click_url` = `{{Click URL}}`, `click_target` = `{{Click Target}}`, `click_text` = `{{Click Text}}`, `fbc`, `fbp`, `event_id`, `external_id`, `server_container_url` (valores como acima).
- **Propriedades do usuário:** `user_fn` = `{{UserData - Name}}`, `user_email` = `{{UserData - Email}}`, `user_phone` = `{{UserData - Phone}}`.
- Acionador: **Cliques (todos)** (ou *Somente links*).

### 4.4 Tag `GA4 - Evento - Lead`
- Nome do evento: `lead`.
- **Parâmetros:** `event_id`, `external_id`, `fbc`, `fbp`, `form_url` = `{{Form URL}}`, `form_element` = `{{Form Element}}`, `form_text` = `{{Form Text}}`, `server_container_url`.
- **Propriedades do usuário:** `user_email`, `user_fn`, `user_phone` como acima **(+)** e também `user_ln` = `{{UserData - Last Name}}`, `user_city`, `user_state`, `user_zip`, `user_country`, `user_dob`, `user_gender` (as variáveis da Fase 3).
- Acionador: **Envio de formulário (todos)**; nomeie-o, por exemplo, `ESM | Lead`. Se o formulário não dispara o gatilho nativo (Elementor/AJAX), use um gatilho de evento personalizado do dataLayer.

### 4.5 Testar no Preview
1. **Visualizar** no GTM Web, informando a URL do site.
2. Verifique: `GA4 - Google Tag` e `GA4 - Evento - Page View` disparam no carregamento; ao clicar em um link, `link_click`; ao enviar o formulário, `lead`.
3. Em cada tag → *Propriedades de saída*, confirme que `event_id` tem valor e que `server_container_url` aponta para o seu servidor.

✅ **Checkpoint 4:** no Tag Assistant/Preview as tags GA4 disparam e há requisições para o seu servidor (`/g/collect`).

---

## Fase 5 · GA4 no **Server** (client, acionadores, tag)

### 5.1 Client
Em *Clientes* confirme que existe o cliente **GA4** (vem por padrão). É ele que recebe os eventos do Web.

### 5.2 Acionadores (tipo *Evento personalizado*)

| Acionador | Nome do evento | Regex |
|---|---|---|
| `GA4 - All Events` | `.*` | **marcar** *Usar correspondência de regex*; "Todos os eventos personalizados" |
| `GA4 - Page View` | `page_view` | não |
| `GA4 - Link Click` | `link_click` | não |
| `GA4 - Lead` | `lead` | não |

(Os nomes dos eventos precisam ser **exatamente** os do Web. No post o texto diz `,*`, mas o correto, como no print, é `.*`.)

### 5.3 Tag GA4 no Server
- Tipo: **Google Analytics: GA4**. ID da métrica: `{{GA4 - ID da Métrica}}`. Acionador: `GA4 - All Events`.

### 5.4 (+) Impedir PII no Google Analytics
As propriedades `user_*` chegam ao servidor e a tag GA4 poderia encaminhá-las ao GA4, o que a política do Google proíbe.
1. **Transformações → Nova → Excluir parâmetros**.
2. Exclua `user_properties` (ou cada `user_*`; opcionalmente `fbc`, `fbp`, `external_id`).
3. Em *Tags a que se aplica*, selecione **apenas a tag GA4** (e a do Google Ads, se existir). **Não** aplique à tag da Meta.

### 5.5 Testar (Preview do Server)
1. No GTM Server → **Visualizar**; deixe aberto.
2. Navegue no site com o Preview do **Web** também ativo.
3. No Preview do Server, cada evento deve aparecer como *Solicitação recebida* → *Cliente GA4 reivindicou*. Abra o evento → **Event Data** e confira: `event_id`, `fbc`/`fbp` (se vieram de anúncio), `external_id`, `user_properties.*` (no `lead`).
4. Ajuste as chaves das variáveis da Fase 3.2 se algum caminho estiver diferente.
5. Confirme que a tag GA4 disparou e que a transformação removeu o `user_properties` **somente** para ela.

✅ **Checkpoint 5:** o servidor recebe `page_view`, `link_click` e `lead`, com `event_id` e identificadores presentes, e a tag GA4 dispara sem PII.

---

## Fase 6 · Meta Pixel no **Web**

Tags *Meta Pixel* (modelo **Meta Pixel / facebook**, na Galeria de modelos). Crie uma por evento: `Meta Ads - Pixel - Page View`, `... - Lead`, `... - Link Click`.

| Campo | Valor |
|---|---|
| Facebook Pixel ID(s) | `{{Meta Ads - Pixel ID}}` |
| Event Name | **Standard**: `PageView` / `Lead`. Para `link_click`: **Custom** |
| Consent Granted (GDPR) | conforme o seu CMP (veja Fase 8) |
| **Enable Advanced Matching** | marcado |
| Customer Information Data Parameters | `External ID` = `{{Meta Ads - External ID}}` |
| (+) idem, no Lead | `Email` = `{{UserData - Email}}`, `Phone`, `First Name`, `Last Name`, `City`, `State`, `Zip`, `Country`, `Date of Birth`, `Gender` com as variáveis `UserData - *` |
| **More Settings → Event ID** | `{{Meta Ads - Event ID}}` |
| Acionador | O mesmo do evento GA4 equivalente (ex.: `ESM \| Lead`) |

Pontos de atenção:
- O **Event ID** do Pixel precisa ser **a mesma variável** usada no parâmetro `event_id` das tags GA4. É o que permite à Meta deduplicar.
- O checkbox *Opt in to a Meta-enabled Conversions API integration* aparece na tag: como a CAPI será enviada pelo servidor, **desmarque** se, no teste, aparecerem eventos de servidor duplicados no Events Manager.

✅ **Checkpoint 6:** no Preview do Web as tags Meta Pixel disparam com os mesmos eventos; no **Meta Pixel Helper** (extensão) o Pixel aparece com o Event ID. No Events Manager → **Test Events** (aba *Navegador*), os eventos aparecem.

---

## Fase 7 · Meta CAPI no **Server**

### 7.1 Instalar o modelo
Server → *Tags → Nova → Configuração da tag → Descubra mais tipos de tag na Galeria* → pesquise **Facebook Conversion API** (autor *stape-io*) → **Adicionar** (confirme as permissões).

### 7.2 Configurar a tag `Meta Ads - Evento - Page View` (repita para Lead e Link Click)

| Campo | Valor |
|---|---|
| **Event Name Setup Method** | **Override** |
| Event Type | **Standard** → `PageView` (Lead: `Lead`; Link Click: **Custom** → `link_click`) |
| Action Source | `Website` |
| Facebook Pixel ID | `{{Meta Ads - Pixel ID}}` |
| API Access Token | `{{Meta Ads - API Token}}` |
| Test ID | código do **Test Events** (só durante testes; **remova antes de publicar**) |
| Override the cookie domain | `False` |
| Generate _fbp cookie if it does not exist | marcado |
| Use HttpOnly cookies for _fbc and _fbp | desmarcado |
| Enable Event Enhancement | marcado |
| **Server Event Data Override** → *Automap Server Event Data* | marcado |
| ↳ Property **Event ID** | `{{Event ID}}` |
| **User Data** → *Automap User Data* | marcado |
| ↳ Email | `{{User Data - Email}}` |
| ↳ Phone | `{{User Data - Phone}}` |
| ↳ First Name | `{{User Data - First Name}}` |
| ↳ Click ID | `{{fbc}}` |
| ↳ Browser ID | `{{fbp}}` |
| ↳ External ID | `{{Meta Ads - External ID}}` |
| ↳ (+) Last Name, City, State, Zip, Country, Date of Birth, Gender | as variáveis `User Data - *` correspondentes |
| Tag Execution Consent Settings | exigir consentimento de publicidade |
| **Acionador** | `GA4 - Page View` / `GA4 - Lead` / `GA4 - Link Click` (cada tag no seu) |

A tag **normaliza e hasheia** (SHA-256) o que precisa, e aceita valores já hasheados. **Não hasheie antes**. IP e User-Agent do visitante são lidos da requisição.

> Cuidado para **não esquecer nenhuma variável** ao repetir o processo nas tags de Lead e Link Click (aviso do próprio post).

### 7.3 Testar
1. Com o **Test ID** preenchido, navegue e envie o formulário (use seus próprios dados reais, pois eventos sem correspondência podem ser descartados).
2. Preview do Server: a tag `Meta Ads - Evento - ...` deve disparar. Abra a tag → *Request sent to Meta*: confira `event_name`, `event_id`, `user_data` (campos hasheados), `fbp`, `fbc`, `client_ip_address`, `client_user_agent`, `event_source_url`, `action_source: website`.
3. Events Manager → **Test Events**: o mesmo evento deve aparecer vindo do **Navegador** e do **Servidor**, com o rótulo **Deduplicado**.

✅ **Checkpoint 7:** os eventos chegam do Navegador e do Servidor ao Test Events, deduplicados, com `user_data` completo.

---

## Fase 8 · Validação final, consentimento e publicação

### 8.1 Checklist de qualidade (EMQ 9+)
Confirme no Test Events e no Preview (detalhe em [docs/06](docs/06-validacao-e-emq.md)):
- [ ] `event_id` idêntico no Pixel, no hit GA4 e na CAPI (deduplicação)
- [ ] `em`, `ph`, `fn`, `ln` presentes e hasheados no `lead`; (+) `ct`, `st`, `zp`, `country`, `db`, `ge` quando o formulário os tiver
- [ ] `external_id` em todos os eventos; `fbp` em quase todos; `fbc` quando há `fbclid`
- [ ] `client_ip_address` do **visitante** (não o IP da Stape) e `client_user_agent`
- [ ] `event_source_url` e `action_source = website`
- [ ] Nenhum campo vazio nem duplo hash

### 8.2 Consentimento (LGPD)
Antes de publicar: CMP integrado ao **Consent Mode v2**; tags de Pixel/CAPI condicionadas ao consentimento de publicidade; sem consentimento, não enviar `user_*`. Detalhes em [docs/07](docs/07-lgpd-consentimento.md).

### 8.3 Limpeza e publicação
1. **Remova o Test ID** de todas as tags `Meta Ads - Evento - *` no Server.
2. **Web:** *Enviar* → nome da versão (ex.: `v1 - GA4 + Meta server-side`) → **Publicar**.
3. **Server:** o mesmo.
4. Em produção, abra o site sem o Preview e confirme em **Events Manager → Visão geral** que os eventos continuam chegando.
5. Se algo quebrar, em **Versões** do GTM publique a versão anterior (rollback).

### 8.4 Monitoramento (primeiros 7 dias)
- Events Manager → cada evento → **taxa de deduplicação** (meta > 90%) e **Event Match Quality** (a nota leva horas a dias para atualizar).
- *Diagnósticos*: corrija avisos de parâmetros ausentes ou mal formatados.
- Compare o volume de `Lead` (Meta) × `lead` (GA4) × leads reais no CRM.
- Acompanhe o consumo de requisições na Stape (Free: 10 mil/mês).

✅ **Checkpoint final:** setup publicado, EMQ medido, deduplicação > 90%.

---

## Anexo A · Estender para e-commerce

Replique o padrão (evento GA4 no Web → acionador no Server → tag Meta no Server + Pixel no Web) para: `view_item`→`ViewContent`, `add_to_cart`→`AddToCart`, `begin_checkout`→`InitiateCheckout`, `add_payment_info`→`AddPaymentInfo`, `purchase`→`Purchase`. Em compras, envie `value`, `currency`, `content_ids`, `contents`, `num_items`, `order_id`. Mapeamento e parâmetros em [docs/01](docs/01-arquitetura-e-infra.md) e [docs/02](docs/02-parametros-capi-emq.md); exemplos de `dataLayer` em [datalayer/](datalayer/).

## Anexo B · Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Subdomínio não valida na Stape | Proxy ativo no DNS; host/valor errado; propagação | Desative o proxy; confira host e destino; aguarde |
| Nenhum hit chega ao servidor | `server_container_url` ausente/errado; adblock | Revise a tag `GA4 - Google Tag`; teste em aba anônima |
| Evento chega, mas sem `user_*` | Variável `UserData - *` vazia (sem formulário padrão) | Verifique os campos do formulário; use gatilho personalizado se o envio for AJAX |
| Variável do Server vazia | Chave do *Dado do evento* incorreta | Compare com o **Event Data** no Preview |
| Eventos duplicados no Meta | `event_id` diferente ou ausente; opt-in "Meta-enabled CAPI" | Use a mesma variável nas três pontas; veja 6 |
| Dedup 0% do Pixel | Pixel sem Event ID | Preencha *More Settings → Event ID* |
| `client_ip_address` é o da Stape | IP não repassado | Confirme o cabeçalho/`ip_override` no Preview |
| EMQ baixo | Visitantes anônimos; poucos campos | Capture e-mail/telefone cedo; envie todos os parâmetros da Fase 7 |
