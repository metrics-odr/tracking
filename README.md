# Tracking Server-Side + Meta CAPI

Projeto de referência para estruturar rastreamento **server-side** com Google Tag Manager (web + server), GA4 e **Meta Conversions API (CAPI)**, com foco em **Event Match Quality (EMQ) ≥ 9** e deduplicação correta com o Pixel.

> **Aviso de fontes.** O post base (<https://eduardomezzavilla.com.br/setup-de-trackeamento-server-side/>) **não pôde ser lido** durante a criação deste repositório (o ambiente bloqueou o domínio). O conteúdo daqui segue a especificação da Meta, a documentação do GTM Server-Side/GA4 e guias de mercado (Stape, Taggrs etc.). Se o post tiver particularidades (ferramenta de hospedagem, nomes de tags, prints), compare com `docs/` e ajuste.
> Também **não é possível garantir** nota 9+: ela depende da qualidade e da cobertura dos dados reais. O repositório maximiza as chances.

## Arquitetura

```
Navegador                         Seu servidor                      Plataformas
┌──────────────┐  GA4 (first-party) ┌───────────────────┐
│ GTM Web      │ ─────────────────► │ GTM Server        │ ──► GA4 (Measurement Protocol)
│  + Meta Pixel│                    │ track.seudominio  │ ──► Meta CAPI  (user_data + event_id)
│  + dataLayer │ ── fbq(event_id) ─►│  GA4 Client       │ ──► (Google Ads, TikTok…)
└──────────────┘      │             └───────────────────┘
                      └──► Meta Pixel (browser)  ── dedup por event_name + event_id ──► Meta
```

Princípios:

1. **Um único `event_id` por ação**, gerado no navegador e enviado ao Pixel *e* ao servidor.
2. **Subdomínio first-party** (`track.seudominio.com.br`) via CNAME/A para o container server, para cookies de longa duração e menos bloqueio.
3. **Máximo de `user_data`** coletado com consentimento (LGPD), normalizado e hasheado (SHA-256) quando exigido.
4. **Pixel + CAPI redundantes** (recomendação da Meta), nunca só um deles.

## Índice

| Doc | Conteúdo |
|---|---|
| [docs/01-arquitetura-e-infra.md](docs/01-arquitetura-e-infra.md) | Fluxo, hospedagem, domínio first-party, cookies |
| [docs/02-parametros-capi-emq.md](docs/02-parametros-capi-emq.md) | **Todos os parâmetros** e regras de normalização/hash para EMQ 9+ |
| [docs/03-gtm-web.md](docs/03-gtm-web.md) | Container web: variáveis, tags, gatilhos |
| [docs/04-gtm-server.md](docs/04-gtm-server.md) | Container server: clients, tags, variáveis, mapeamento |
| [docs/05-deduplicacao.md](docs/05-deduplicacao.md) | `event_id`, `external_id`, regras e verificação |
| [docs/06-validacao-e-emq.md](docs/06-validacao-e-emq.md) | Testes, Events Manager, diagnóstico, checklist de 9+ |
| [docs/07-lgpd-consentimento.md](docs/07-lgpd-consentimento.md) | Consentimento e boas práticas legais |
| [datalayer/](datalayer/) | Exemplos de `dataLayer` por evento (GA4 ecommerce + user_data) |
| [gtm-web/](gtm-web/) | JS de apoio: `event_id`, `fbc/fbp`, `external_id`, coleta de user_data |
| [server/](server/) | Referência em Node (sem dependências) para enviar CAPI direto (CRM/webhooks/offline) com testes |

## Quick start

1. Leia `docs/01` e provisione o container server + subdomínio.
2. Implemente o `dataLayer` conforme `datalayer/` e `gtm-web/`.
3. Configure o GTM web (`docs/03`) e o server (`docs/04`).
4. Valide dedup e EMQ (`docs/05`, `docs/06`).
5. (Opcional) `cd server && npm test` para rodar os testes do normalizador/hasher.
