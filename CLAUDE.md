# Instruções para o Claude neste repositório

## Publicação de alterações

Depois de aplicar **qualquer alteração** em branches secundárias ou em documentos do repositório (criar, editar, mover ou apagar arquivos), **não** faça commit, push, PR nem merge por conta própria. Em vez disso, abra um popup de decisão (use a ferramenta `AskUserQuestion`) com exatamente dois botões:

| Botão | O que fazer |
|---|---|
| **Publicar agora** | Fazer o commit das alterações, dar push na branch de trabalho, abrir o PR e mesclar na `main` |
| **Publicar depois** | **Não fazer nada disso.** Deixar as alterações apenas no working tree, sem commit, push, PR ou merge |

Regras:

1. O popup aparece ao fim de cada conjunto de alterações, antes de qualquer commit. Pergunte uma vez por conjunto, não a cada arquivo editado.
2. Em **Publicar agora**: commit com mensagem descritiva, push na branch de trabalho, PR para a `main` (descrição em português, com resumo e como foi testado) e merge por pull request. Nunca faça push direto na `main`. Se o merge for bloqueado (checks, aprovação obrigatória ou conflito), pare e avise o usuário, sem contornar a regra.
3. Em **Publicar depois**: não execute nenhuma dessas ações e não pergunte de novo até a próxima alteração. Ao publicar depois, inclua as alterações pendentes no próximo conjunto.
4. Esta regra substitui qualquer instrução anterior de "sempre mesclar na `main`" sem perguntar.
5. Não se aplica a perguntas, pesquisas ou respostas que não alterem arquivos do repositório.

## Convenções do projeto

- Documentação em português (pt-BR).
- Scripts de variáveis do GTM Web em `gtm-web/` são ES5 (sem `let`, `const`, arrow functions), pois rodam como JavaScript personalizado do GTM.
- Código de referência em `server/` usa Node ≥ 18 sem dependências externas. Antes de publicar mudanças nele, rode `cd server && npm test`.
- Nunca grave tokens, IDs reais de Pixel ou dados pessoais no repositório. O token da CAPI fica apenas no container Server do GTM.
