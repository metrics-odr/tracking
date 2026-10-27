# 00 · O setup do post e o que falta para EMQ 9+

Base: [Setup Completo de Trackeamento Server Side com o GTM e GA4](https://eduardomezzavilla.com.br/setup-de-trackeamento-server-side/) (texto e prints lidos integralmente). Este repositório **segue esse setup** e completa o que falta para chegar a EMQ ≥ 9.

## Como o setup do post funciona

**O GA4 coordena tudo.** Todo evento passa pelo GA4: o evento GA4 disparado no container **Web** é o acionador dos eventos do Meta Ads (e Google Ads) no container **Server**.

```
Site ─ GTM Web ─┬─ Meta Pixel (navegador, eventID) ───────────────────────┐
                └─ GA4 (server_container_url = https://server.dominio) ┐  │ dedup:
                                                                       ▼  │ event_name + event_id
                      Stape (SA East/Brasil) ─ GTM Server ─ GA4 Client    │
                         ├─ Tag Facebook Conversion API (Stape) ──────────┴──► Meta
                         └─ Tag GA4 / Google Ads
```

| Fase | Conteúdo no post |
|---|---|
| 1 | Criar GTM Web, instalar, validar (Tag Assistant); criar container Server; conta Stape; container Stape (mesmo nome, região **SA East – Brasil**, plano Free 10 mil req/mês); subdomínio via **CNAME** (`server` → `sab.stape.io`, proxy desativado); URL do servidor em *Admin → Configurações do contêiner* |
| 2 | Variáveis Web e Server; GA4 Google Tag e eventos (`page_view`, `link_click`, `lead`); acionadores e variáveis no Server; tags GA4 no Server |
| 3 | Tags Meta Ads (Pixel no Web + **Facebook Conversion API da Stape** no Server) e Google Ads |

Detalhes por container: [03-gtm-web.md](03-gtm-web.md) e [04-gtm-server.md](04-gtm-server.md).

## O que o post envia hoje ao Meta

| Origem | Parâmetros |
|---|---|
| `user_data` | `em` (e-mail), `ph` (telefone), `fn` (primeiro nome) |
| Identificadores | `fbc`, `fbp`, `external_id` (GA4 Client ID) |
| Automáticos (tag Stape) | `client_ip_address`, `client_user_agent`, `event_source_url`, `action_source=website` (confirmar no Preview) |
| Evento | `event_id` (template *Event ID* do mbaersch), `event_name` |

Para um formulário de lead isso costuma render EMQ na faixa de 6–8. Para passar de 9 faltam parâmetros e cobertura.

## Lacunas e correções (ordem de impacto)

| # | Lacuna | Correção neste repo |
|---|---|---|
| 1 | Faltam `ln`, `ct`, `st`, `zp`, `country`, `db`, `ge` | Variáveis `UserData - *` em [`gtm-web/`](../gtm-web/) + user properties no GA4 + propriedades na tag Stape |
| 2 | Variáveis `UserData - Email/Phone/Name` marcadas "Link do Script: Em Breve" | Scripts prontos: `userdata-email.js`, `userdata-phone.js`, `userdata-name.js` |
| 3 | `external_id` = GA4 Client ID: identifica o **navegador**, não a pessoa | Mantenha como fallback; quando houver login/CRM, envie o ID do usuário (mesmo formato no Pixel e na CAPI) |
| 4 | `user_data` só existe no evento de formulário; os demais eventos (page_view, link_click) vão sem e-mail/telefone | Persistir na sessão (os scripts já fazem) e reenviar nos eventos seguintes, com consentimento |
| 5 | PII (`user_email`, `user_phone`...) como *user properties* do GA4 pode ser **encaminhada ao Google Analytics** pela tag GA4 do Server | Excluir esses campos da tag GA4 do Server com uma Transformação (ver doc 04, seção 6). A política do GA4 proíbe enviar PII |
| 6 | Só 3 eventos (page_view, link_click, lead) | Mapa completo (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`...) em [01](01-arquitetura-e-infra.md) |
| 7 | Checkbox "Opt in to a Meta-enabled Conversions API integration" no Pixel | Revise no Events Manager se surgem eventos de servidor duplicados além da tag Stape; desmarque se a CAPI já é feita pelo sGTM |
| 8 | Validação de EMQ/dedup não coberta | [05](05-deduplicacao.md) e [06](06-validacao-e-emq.md) |
| 9 | Parameter Builder Library (link do post) adiciona sufixo a `fbc`/`fbp` e hasheia no cliente | Validadores de `server/` aceitam o sufixo; ver [02](02-parametros-capi-emq.md) |

## Observação sobre o post

O texto do acionador "All Events" diz `,*`, mas o print mostra a regex correta: **`.*`** com *Usar correspondência de regex* marcado. Use `.*`.
