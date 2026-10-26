# 06 · Validação e metas de EMQ 9+

## Fluxo de teste

1. GTM Web em **Preview** + GTM Server em **Preview**.
2. Events Manager → **Test Events** → copie o *Test Event Code* e coloque na tag CAPI (**remova antes de publicar**).
3. Navegue o funil completo: PageView → ViewContent → AddToCart → InitiateCheckout → AddPaymentInfo → Purchase / Lead.
4. Para cada evento no Test Events verifique:
   - Origem **Browser** e **Server** com dedup.
   - Em *Parâmetros de correspondência avançada*: `em`, `ph`, `fn`, `ln`, `ct`, `st`, `zp`, `country`, `external_id`, `fbp`, `fbc`, IP, UA presentes.
   - `value`/`currency` em compras.

## Painel de qualidade

- **Overview → Event match quality**: anote nota por evento.
- **Diagnostics**: corrija avisos (`fbc` ausente, IP/UA ausente, hash inválido).
- API: `GET /{dataset_id}/dataset_quality` (Dataset Quality API) para monitorar programaticamente.

## Checklist para 9+

- [ ] `event_id` em 100% dos eventos (Pixel + CAPI)
- [ ] `em` e `ph` hasheados e normalizados (BR: `55` + DDD + número)
- [ ] `fn`, `ln`, `ct`, `st`, `zp`, `country` enviados (normalizados)
- [ ] `db`, `ge` quando coletados
- [ ] `external_id` estável (login/CRM/cookie) em **todos** os eventos
- [ ] `fbp` em quase 100% dos eventos web
- [ ] `fbc` sempre que houver `fbclid` (cookie `_fbc` preservado/recriado)
- [ ] IP do **visitante** (preferir IPv6) e UA original
- [ ] Sem duplo hash; sem hash de string vazia
- [ ] `event_source_url` e `action_source=website`
- [ ] `event_time` correto (segundos, não ms)
- [ ] Envio em tempo real (<1h; ideal segundos)
- [ ] Domínio first-party do servidor e cookies definidos via HTTP
- [ ] Persistência de `user_data` entre eventos da mesma sessão (com consentimento)

## Por que a nota pode ficar abaixo de 9

| Causa | Ação |
|---|---|
| Visitante anônimo (sem email/telefone) | Captura precoce (newsletter, login social, checkout em 1 etapa); Advanced Matching |
| IP do servidor em vez do visitante | Verificar `ip_override`/cabeçalho `X-Forwarded-For` |
| Baixo `fbc` | Preservar `fbclid` entre páginas; recriar cookie `_fbc` |
| Formatação | Rodar `server/` testes e comparar formato |
| ITP/Safari | Cookies via servidor (`FPID`), CNAME em mesma raiz |

> A nota é por evento e por período; PageView/ViewContent costumam ficar abaixo de Purchase/Lead por não terem PII. Foque a meta de 9+ nos eventos de conversão.
