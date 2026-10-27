# Tracking Server-Side + Meta CAPI

Projeto de referência para estruturar rastreamento **server-side** com Google Tag Manager (web + server), GA4 e **Meta Conversions API (CAPI)**, com foco em **Event Match Quality (EMQ) ≥ 9** e deduplicação correta com o Pixel.

> **Base.** Segue o setup do post [Setup Completo de Trackeamento Server Side](https://eduardomezzavilla.com.br/setup-de-trackeamento-server-side/) (GTM Web + GTM Server na Stape + GA4 como orquestrador + tag Facebook Conversion API da Stape) e o completa com os parâmetros da documentação oficial da Meta para EMQ 9+. Veja [docs/00](docs/00-post-resumo-e-lacunas.md).
> **Não é possível garantir** nota 9+: ela depende da qualidade e da cobertura dos dados reais. O repositório maximiza as chances.

## Arquitetura

```
Navegador                         Seu servidor                      Plataformas
┌──────────────┐  GA4 (first-party) ┌───────────────────┐
│ GTM Web      │ ─────────────────► │ GTM Server        │ ──► GA4 (Measurement Protocol)
│  + Meta Pixel│                    │ server.seudominio │ ──► Meta CAPI  (user_data + event_id)
│  + dataLayer │ ── fbq(event_id) ─►│  GA4 Client       │ ──► (Google Ads, TikTok…)
└──────────────┘      │             └───────────────────┘
                      └──► Meta Pixel (browser)  ── dedup por event_name + event_id ──► Meta
```

Princípios:

1. **Um único `event_id` por ação**, gerado no navegador e enviado ao Pixel *e* ao servidor.
2. **Subdomínio first-party** (`server.seudominio.com.br`) via CNAME/A para o container server, para cookies de longa duração e menos bloqueio.
3. **Máximo de `user_data`** coletado com consentimento (LGPD), normalizado e hasheado (SHA-256) quando exigido.
4. **Pixel + CAPI redundantes** (recomendação da Meta), nunca só um deles.

## Índice

| Doc | Conteúdo |
|---|---|
| [SETUP.md](SETUP.md) | **Passo a passo completo, em ordem de aplicação** (Stape, GTM, GA4, Meta Pixel + CAPI) |
| [docs/00-post-resumo-e-lacunas.md](docs/00-post-resumo-e-lacunas.md) | Resumo do post, o que ele envia hoje e as lacunas para 9+ |
| [docs/01-arquitetura-e-infra.md](docs/01-arquitetura-e-infra.md) | Fluxo, hospedagem, domínio first-party, cookies |
| [docs/02-parametros-capi-emq.md](docs/02-parametros-capi-emq.md) | **Todos os parâmetros** e regras de normalização/hash para EMQ 9+ |
| [docs/03-gtm-web.md](docs/03-gtm-web.md) | Container web: variáveis, tags GA4, Meta Pixel |
| [docs/04-gtm-server.md](docs/04-gtm-server.md) | Stape, DNS, container server, tag CAPI, PII no GA4 |
| [docs/05-deduplicacao.md](docs/05-deduplicacao.md) | `event_id`, `external_id`, regras e verificação |
| [docs/06-validacao-e-emq.md](docs/06-validacao-e-emq.md) | Testes, Events Manager, diagnóstico, checklist de 9+ |
| [docs/07-lgpd-consentimento.md](docs/07-lgpd-consentimento.md) | Consentimento e boas práticas legais |
| [datalayer/](datalayer/) | Exemplos de `dataLayer` por evento (GA4 ecommerce + user_data) |
| [gtm-web/](gtm-web/) | JS de apoio: `UserData - *` (e-mail, telefone, nome, endereço...), `event_id`, `fbc`, `external_id` |
| [server/](server/) | Referência em Node (sem dependências) para enviar CAPI direto (CRM/webhooks/offline) com testes |

## Quick start

**Guia principal, em ordem de aplicação: [SETUP.md](SETUP.md).** Resumo:

1. Leia `docs/01` e provisione o container server + subdomínio.
2. Implemente o `dataLayer` conforme `datalayer/` e `gtm-web/`.
3. Configure o GTM web (`docs/03`) e o server (`docs/04`).
4. Valide dedup e EMQ (`docs/05`, `docs/06`).
5. (Opcional) `cd server && npm test` para rodar os testes do normalizador/hasher.
