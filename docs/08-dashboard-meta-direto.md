# 08 - Dashboards com conexão direta ao Meta Ads (Cloudflare Worker)

> **Status:** em andamento (etapa de preparação). Este documento será atualizado ao final do processo com o que foi de fato implementado, decisões e lições aprendidas.
> **Atenção:** nunca registre aqui (nem em nenhum arquivo do repositório) o `META_TOKEN`, a `DASH_KEY`, o App Secret ou qualquer dado pessoal. IDs reais de conta de anúncios também devem ficar fora do repositório.

## 1. Objetivo

Hoje as dashboards usam o Google Planilhas como fonte de dados, e as Queries do Meta Ads alimentam essas planilhas. A meta é:

1. Remover a fonte das Queries do Meta Ads e fazer a dashboard consultar o Meta Ads diretamente.
2. Incluir botões para ativar e desativar campanhas, conjuntos e anúncios, sem abrir o Gerenciador de Anúncios.
3. Mostrar nas tabelas de anúncios a prévia do anúncio exatamente como ela é.
4. Manter todos os cruzamentos de dados funcionando (a maioria das métricas mescla duas ou mais fontes).
5. Não alterar layout, fonte, CSS ou qualquer outro aspecto do front-end, além do necessário para os botões e a prévia.

Começamos por **uma dashboard piloto**. Depois, replicamos para as demais.

## 2. Arquitetura

```
Dashboard (GitHub Pages, estática)
        │  HTTPS + cabeçalho com DASH_KEY
        ▼
Cloudflare Worker (proxy)  ── guarda META_TOKEN como Secret
        │  Marketing API (Graph API)
        ▼
Meta Ads
```

- A dashboard **não guarda o token do Meta**. Ela só conhece a URL do Worker e a `DASH_KEY`.
- O Worker valida a `DASH_KEY`, libera CORS só para a URL da dashboard e expõe poucas rotas:
  - `/insights`: dados por campanha, conjunto e anúncio.
  - `/preview/{ad_id}`: prévia oficial do anúncio (iframe da Meta).
  - `/status`: ligar (`ACTIVE`) ou desligar (`PAUSED`). Aceita só esses dois valores e só contas permitidas.
- Recomendado: colocar o Worker atrás do **Cloudflare Access** (login Google) para a `DASH_KEY` não ficar exposta no HTML público.

## 3. Regras de navegação e dos botões On/Off

As 3 tabelas (campanhas, conjuntos e anúncios) são correlacionadas: o filtro de um nível restringe o nível abaixo.

- Sem filtro, o Meta não saberia qual entidade desligar. Por isso:
  - **Campanhas:** o botão funciona sempre.
  - **Conjuntos:** só funciona com uma campanha filtrada.
  - **Anúncios:** só funciona com uma campanha e um conjunto filtrados.
- Os botões ficam **sempre visíveis**, com este padrão de cor:

| Estado | Aparência |
|---|---|
| Desabilitado (falta filtrar o nível superior) | Claro e esmaecido |
| Estrutura ATIVADA (pode desativar) | Azul |
| Estrutura DESATIVADA (pode ativar) | Cinza, mais destacado que o esmaecido |

- Layout parecido com o do Gerenciador de Anúncios (conforme o print de referência com 2 anúncios, um ativo e um desativado).
- As linhas devem ser **ordenáveis por status** (On/Off).

## 4. Cruzamento de dados

- Os dados que vinham das Queries passam a vir do Worker (`/insights`).
- Os cruzamentos com as demais fontes devem usar, sempre que possível, o **ID da entidade** (campanha, conjunto, anúncio) como chave, em vez do nome.
- Validação: comparar os números novos com os da planilha atual para o mesmo período, para garantir que os cruzamentos continuam batendo.

## 5. Passo a passo (clique a clique)

> As telas da Meta mudam com frequência. Se algum nome estiver diferente, use o caminho equivalente.

### Parte A: criar o App no Meta for Developers

1. Entre em **developers.facebook.com** com o perfil que administra a BM.
2. Na primeira vez, clique em **Começar** e conclua o cadastro de desenvolvedor.
3. Clique em **Meus Apps** e depois em **Criar App**.
4. Nome do app, por exemplo `Dash Tráfego`, e seu e-mail.
5. Em **Portfólio empresarial**, selecione a BM onde estão as contas de anúncios e clique em **Avançar**.
6. Em "Casos de uso", escolha **Outro** e clique em **Avançar**.
7. Em "Tipo de app", escolha **Empresa** (Business) e clique em **Avançar**.
8. Clique em **Criar app** e confirme a senha, se pedido.
9. Em **Configurações do app → Básico**, anote o **ID do app**. O App Secret não é necessário.

O app pode ficar em modo **Desenvolvimento**. Para as próprias contas, funciona sem App Review.

### Parte B: conferir o app na BM

1. Em **business.facebook.com**, abra **Configurações do negócio**.
2. Vá em **Contas → Aplicativos**. O app deve aparecer.
3. Se não aparecer: **Adicionar → Conectar um ID de app** e cole o ID do app.

### Parte C: criar o usuário do sistema

1. **Configurações do negócio → Usuários → Usuários do sistema → Adicionar**.
2. Nome, por exemplo `dash-api`, função **Admin**, e clique em **Criar usuário do sistema**.
3. Selecione o usuário e clique em **Atribuir ativos**.
4. Na aba **Contas de anúncios**, marque a conta da dashboard piloto, ative **Gerenciar conta de anúncios** (controle total) e salve.
5. Opcional: na aba **Páginas**, atribua a Página dos anúncios (identidade nas prévias).

### Parte D: gerar o token

1. Com o usuário `dash-api` selecionado, clique em **Gerar token**.
2. Selecione o app criado na Parte A.
3. Expiração: **Nunca**, se disponível. Se não, 60 dias, e planejar a renovação.
4. Marque as permissões **ads_read** e **ads_management**.
5. Clique em **Gerar token** e copie o valor imediatamente (ele não aparece de novo).
6. Guarde em um gerenciador de senhas. **Não o cole em chat, issue, PR ou arquivo do repositório.**

### Parte E: Cloudflare Worker

1. Crie a conta em **dash.cloudflare.com** e verifique o e-mail.
2. **Workers & Pages → Create → Create Worker**.
3. Nome, por exemplo `dash-meta-proxy`, e clique em **Deploy**. Anote a URL do Worker (ela é pública).
4. Em **Settings → Variables and Secrets → Add**, crie dois **Secrets**:
   - `META_TOKEN`: o token da Parte D.
   - `DASH_KEY`: uma senha longa e aleatória, criada por você.
5. Clique em **Deploy** para salvar.

## 6. Pendências para iniciar a implementação

| Item | Quem | Situação |
|---|---|---|
| ID do App Meta (não é segredo) | Eduardo | Pendente |
| ID da conta de anúncios da dashboard piloto | Eduardo | Pendente |
| URL do Worker | Eduardo | Pendente |
| `owner/repo` do repositório da dashboard e acesso de escrita | Eduardo | Pendente |
| Qual é a dashboard piloto | Eduardo | Pendente |
| Print do Gerenciador com 2 anúncios (um ativo, um pausado) | Eduardo | Pendente |
| Planilha atual da piloto, abas/colunas das Queries e chave de junção dos cruzamentos | Eduardo | Pendente |
| Código do Worker (`worker.js`) | Claude | Aguardando os itens acima |
| Troca das Queries por chamadas ao Worker na dashboard | Claude | Aguardando |
| Botões On/Off, ordenação por status e prévia do anúncio | Claude | Aguardando |
| Validação dos números contra a planilha atual | Claude | Aguardando |

## 7. Registro final (a preencher ao concluir)

Ao final do processo, este documento será atualizado com:

- Rotas finais do Worker e como fazer o deploy.
- Campos e métricas da Marketing API usados e o mapeamento das colunas das Queries.
- Chaves de junção usadas nos cruzamentos.
- Resultado da validação contra a planilha.
- Como replicar para as demais dashboards.
- Limitações e problemas encontrados (limites de taxa da API, expiração do token, etc.).
