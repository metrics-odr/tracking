# Alternativas ao Stape para enviar eventos ao servidor

> **Data da pesquisa:** 27/10/2026. Preços e telas mudam com frequência. Antes de pagar qualquer coisa, confirme o valor na página oficial (links no fim de cada método).
> **Contexto do projeto:** este repositório usa GTM Web + GTM Server + GA4 + Meta CAPI, com o container server hospedado na Stape (ver [SETUP.md](SETUP.md) e [docs/04](docs/04-gtm-server.md)).
> **Regra deste documento:** só aparece como "passo" o que foi confirmado em documentação oficial. O que não pude confirmar está marcado com ⚠️ e reunido na seção [Revisão: o que foi e o que não foi verificado](#revisão-o-que-foi-e-o-que-não-foi-verificado).

---

## 0. Recomendação para o seu perfil

**Seu perfil (respondido por você):** GTM Server enviando para **Meta e GA4** (sem Google Ads por ora), **requisições ilimitadas**, **menor custo possível (de preferência grátis)**, e você configura DNS sem dificuldade.

**Conclusão:** nenhuma opção gerenciada combina "grátis" com "ilimitado". Os limites gratuitos são: Stape 10 mil, TAGGRS 10 mil, Addingwell 100 mil, Zaraz 1 milhão de eventos/mês. A única forma de ter **requisições sem teto de contrato** a custo baixo é **hospedar você mesmo** (método 6, um VPS de ~€4–6/mês). O custo passa a depender só da capacidade da máquina, não do número de requisições.

| Prioridade | Caminho | Por quê |
|---|---|---|
| 1ª escolha | **Método 6: VPS com Docker** | Sem limite de requisições, custo fixo baixo, mantém o GTM Server e o projeto como estão. Exige mais trabalho e você cuida da manutenção. |
| Para começar sem risco | **Método 2: Addingwell Free** | Grátis até 100 mil req/mês e quase sem esforço. Serve para começar e migrar para o VPS depois, se o volume crescer. |
| Não recomendado para você | Métodos 3 e 5 | Cloud Run (~US$ 90/mês no mínimo recomendado) e Gateway da Meta (só Meta, não atende o GA4) custam mais e não são ilimitados de graça. |
| Só se aceitar mudar a arquitetura | Método 4 (Zaraz) | Grátis até 1 milhão de eventos, mas acima disso **desliga** (a menos que pague US$ 5 por milhão extra) e a deduplicação com o Pixel não está confirmada. |

**Sobre servidores gratuitos de nuvem (verificado):** a imagem oficial do GTM Server (`gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable`) é publicada **apenas para amd64/x86** (conferi a configuração da imagem no registro do Google em 27/10/2026). Por isso as máquinas ARM do plano gratuito da Oracle (Ampere A1) **não são uma opção direta**. As VMs gratuitas x86 da Oracle têm 1/8 de OCPU e 1 GB de memória, pequenas demais ([Oracle](https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm)). Ao contratar um VPS pago, **escolha um plano x86 (não ARM)**. Esta é a minha conclusão a partir dessas duas informações; não testei rodar a imagem nessas máquinas.

---

## 1. Resumo rápido

### Ranking: do mais fácil ao mais difícil

| # | Método | Mantém o GTM Server do projeto? | Custo (referência) | Dificuldade |
|---|---|---|---|---|
| 1 | **TAGGRS** (hospedagem gerenciada) | Sim | Grátis até 10 mil req/mês; pago a partir de ~€22/mês (750 mil req) | ⭐ Muito fácil |
| 2 | **Addingwell** (hospedagem gerenciada) | Sim | Grátis até 100 mil req/mês (1 região); pago a partir de €90/mês (2 milhões req) | ⭐ Muito fácil |
| 3 | **Google Cloud Run** (provisionamento automático do GTM) | Sim | ~US$ 45 por servidor/mês; recomendado mínimo de 2 servidores | ⭐⭐ Fácil/médio |
| 4 | **Cloudflare Zaraz** (substitui o GTM Server) | **Não** (outra arquitetura) | 1 milhão de eventos/mês grátis | ⭐⭐⭐ Médio |
| 5 | **Meta Conversions API Gateway** (só Meta, na sua AWS) | **Não** (só Meta) | Software grátis; nuvem ~US$ 39/mês (10 mi eventos, estimativa da Meta) | ⭐⭐⭐⭐ Difícil |
| 6 | **VPS próprio com Docker** (autohospedado) | Sim | VPS de ~€4–6/mês (preços variam, ver nota) | ⭐⭐⭐⭐⭐ Mais difícil |

Referência (o que você paga hoje): **Stape** Free 10 mil req; Pro US$ 20/mês (US$ 17 no anual) até 500 mil req; Business US$ 100/mês (US$ 83 no anual) até 5 milhões req. Fonte: [stape.io/price](https://stape.io/price).

### Leitura honesta sobre economia

- Os gerenciados "iguais ao Stape" (TAGGRS e Addingwell) **não são muito mais baratos** que o Stape Pro. A economia real está em: **Addingwell grátis (100 mil req)**, **Zaraz (1 milhão grátis, mas muda a arquitetura)** e **VPS próprio (mais barato, porém mais trabalho e menos redundância)**.
- **Cloud Run oficial do Google costuma sair mais caro** que o Stape para volumes pequenos (US$ 45 por servidor, mínimo recomendado de 2).
- Se o seu volume é de até ~100 mil requisições/mês, o caminho de menor custo e menor esforço é o **Addingwell Free** (confira antes a região do servidor, ver ⚠️ no método 2).

### O que muda no projeto ao trocar de hospedagem

Em todos os métodos que mantêm o GTM Server (1, 2, 3 e 6), as partes de **GTM Web**, **dataLayer**, **event_id** e a **tag Facebook Conversion API** continuam iguais. Muda só **onde o container server roda** e o **DNS do subdomínio** (passos 3 a 7 de [docs/04, seção 1](docs/04-gtm-server.md)). Recursos exclusivos da Stape deixam de existir, por exemplo o Stape Store citado no fim do [docs/04](docs/04-gtm-server.md) (alternativa: Firestore do Google) e Cookie Keeper / Custom Loader da Stape. ⚠️ Cada concorrente tem recursos equivalentes próprios, com nomes diferentes (TAGGRS: "Cookie Recovery"; Addingwell: "cookie restore").

---

## 2. Anexos usados por mais de um método

### Anexo A. Criar o container Server no GTM e copiar o código de configuração

Usado nos métodos 1 (manual), 2, 3 (manual) e 6. Fonte: [TAGGRS](https://taggrs.io/docs/server-side-tracking/setup/gtm-server-hosting) e [Addingwell](https://docs.addingwell.com/configure-server-side-environment-addingwell-workspace).

1. Acesse [tagmanager.google.com](https://tagmanager.google.com) e entre na sua conta.
2. Clique em **Administrador** (Admin).
3. Na coluna de contêineres, clique no **+** (criar contêiner).
4. Digite o nome do contêiner e marque **Server** como plataforma de destino. Clique em criar.
5. Na tela "como provisionar", escolha **Manually provision tagging server** (provisionar manualmente).
6. Copie o **código/token de configuração** (container configuration) que aparece. Você vai colá-lo na plataforma de hospedagem.

> Se você já tem o container Server criado (porque já seguiu o [SETUP.md](SETUP.md) com a Stape), **reutilize o mesmo container**: basta pegar o código de configuração dele, sem criar outro. ⚠️ Não verifiquei em qual tela do GTM o código de um container já existente fica; no guia do Simo Ahava ele é obtido clicando no ID do container na barra superior do GTM Server. Fonte: [simoahava.com](https://www.simoahava.com/gtmtips/setup-google-tag-manager-server-cloud-run/).

### Anexo B. Apontar o GTM para a nova URL do servidor

1. No GTM, abra o container **Server**.
2. Vá em **Administrador → Configurações do contêiner**.
3. Clique em **Adicionar URL**, cole a URL do seu servidor (ex.: `https://server.seudominio.com.br`) e clique em **Salvar**.
4. Teste abrindo `https://server.seudominio.com.br/healthy` no navegador. Deve aparecer `ok`.
5. Clique em **Visualizar** (Preview) no GTM Server para confirmar que os eventos chegam.

Fonte: [Google, guia Cloud Run](https://developers.google.com/tag-platform/tag-manager/server-side/cloud-run-setup-guide) (os passos de URL do servidor e `/healthy` valem para qualquer hospedagem).

Depois disso, no **GTM Web** a URL do servidor (`server_container_url` / transport URL da tag GA4) deve apontar para o novo subdomínio, conforme [docs/03](docs/03-gtm-web.md). Se você mantiver o **mesmo subdomínio** que usava na Stape, não precisa mexer no GTM Web.

---

## Método 1. TAGGRS

**Por que é o mais fácil:** o próprio TAGGRS cria o container Server no GTM para você ("Automatic setup via Google"), e o domínio exige um único registro DNS.

**Custo.** Free: 10 mil req/mês. Planos pagos (preço do plano anual, que dá 13% de desconto): Basic ~€22 (750 mil req), Pro ~€57 (3 milhões req), Ultimate ~€127 (10 milhões req). Fonte: [taggrs.io/prices](https://taggrs.io/prices/). ⚠️ A página não deixa claro, no texto que consegui ler, qual moeda e qual valor é mensal ou anual (o preço mensal parece ser ~€25 no Basic). Confirme na página.
**Atenção:** multi-domínio só a partir do Pro. Subdomínio personalizado está incluído em todos os planos.

### Macro etapas

1. Criar conta no TAGGRS.
2. Criar um projeto ("Add new setup") com configuração automática via Google.
3. Criar o registro DNS do subdomínio e validar.
4. Apontar o GTM para a URL do servidor e testar.
5. (Se vindo da Stape) Remover a hospedagem antiga depois de validar.

### Passo a passo detalhado

**Etapa 1. Criar a conta**

1. Acesse `dashboard.taggrs.io/register`.
2. Preencha o cadastro e confirme.
3. Faça login para abrir o painel (dashboard).

**Etapa 2. Criar o projeto (automático)**

1. No painel, clique em **Add new setup**.
2. Escolha **Automatic setup via Google** (recomendado).
3. Entre com a sua conta Google (a mesma que administra o GTM).
4. Selecione a **conta do GTM** que você quer conectar.
5. Escolha o **Web container** (o seu container Web atual).
6. Escolha **Create a new server container** (recomendado) ou **Use an existing one**. Se criar um novo, o TAGGRS cria o container Server no GTM e já adiciona a tag de rastreamento do TAGGRS.
7. Preencha **Product name**, **Domain / subdomain** (ex.: `server.seudominio.com.br`) e **Preferred server location** (escolha a mais próxima dos seus visitantes; para o Brasil, veja se há opção na América do Sul ⚠️, a página não lista as regiões).
8. Clique em **Create**.

*Alternativa manual:* clique em **Manual setup**, preencha os mesmos três campos, crie o container Server no GTM pelo [Anexo A](#anexo-a-criar-o-container-server-no-gtm-e-copiar-o-código-de-configuração), cole o **Server container configuration code** no campo correspondente e clique em **Create**.

**Etapa 3. Subdomínio e DNS**

1. Nas configurações do container no TAGGRS, escolha **Custom domain** e digite o subdomínio (ex.: `server.seudominio.com.br`). O TAGGRS gera o registro DNS e mostra o IP. Deixe a tela aberta.
2. No painel do seu provedor de DNS, crie um registro com estes valores:

   | Tipo | Nome/Host | Valor | TTL |
   |---|---|---|---|
   | **A** | só o prefixo, ex.: `server` (não o domínio completo) | o IP mostrado no painel do TAGGRS | 300 segundos (ou o mais próximo disponível) |

3. Se o DNS for **Cloudflare**, desligue o proxy (nuvem **cinza**) e use TTL de 5 minutos.
4. Salve. No TAGGRS clique em **Validate**.
5. Abra o subdomínio em outra aba: deve aparecer uma página de confirmação do TAGGRS.
6. A propagação pode levar até 24 horas. Confirme o rótulo **verde** na visão geral do produto (indica que o roteamento está configurado).

**Etapa 4. Ligar o GTM e testar**

1. Siga o [Anexo B](#anexo-b-apontar-o-gtm-para-a-nova-url-do-servidor).
2. Se aparecer erro **403**, confira se o container Web está **publicado** e se você está usando o **ID de medição do GA4** (e não o ID do container server), conforme a própria documentação do TAGGRS.

⚠️ O guia do TAGGRS cita ainda um passo "Set up automatically → Continue → autorização única automática ou configuração manual" para rotear dados pelo seu domínio, mas não detalha as telas. Se ele aparecer no seu painel, siga as instruções na tela ou escreva para support@taggrs.io.

**Fontes:** [Get started](https://taggrs.io/docs/server-side-tracking/setup/gtm-server-hosting) · [Subdomínio](https://taggrs.io/docs/server-side-tracking/setup/subdomain) · [Preços](https://taggrs.io/prices/)

---

## Método 2. Addingwell

**Por que é fácil:** você cola o código do container, informa o subdomínio e adiciona os registros DNS que o painel mostra. O servidor é criado automaticamente.

**Custo.** Free: 100 mil req/mês, **1 região**. Pay as you go: a partir de **€90/mês** com 2 milhões de req incluídos (requisições extras são cobradas no fim do ciclo; não acumulam para o mês seguinte). Só contam as requisições **que chegam** ao seu container GTM, não as enviadas aos destinos. Fonte: [addingwell.com/plans](https://www.addingwell.com/plans).
**Atenção:** multi-região, cookie restore e monitoramento aparecem como recursos dos planos pagos. Um domínio está incluído; domínios adicionais custam €10 cada ⚠️ (a página não deixa claro a qual plano isso se aplica).
⚠️ **A página não informa em qual região fica o servidor do plano Free.** Se a sua audiência é brasileira, pergunte ao suporte antes de migrar.

### Macro etapas

1. Criar conta e o "Container" no Addingwell.
2. Criar o container Server no GTM e copiar o código.
3. Informar o subdomínio e criar os registros DNS.
4. Aguardar o provisionamento automático.
5. Apontar o GTM para o servidor e testar.

### Passo a passo detalhado

**Etapa 1. Conta e container**

1. Acesse o site do Addingwell e clique em **Start free trial**.
2. Preencha o formulário de cadastro.
3. Crie o **Container** (dê um nome) e escolha a conta de faturamento (ou use uma existente). Confirme a criação.
4. O Addingwell mostrará uma tela pedindo o **token de configuração** do seu container GTM Server.

**Etapa 2. Container Server no GTM**

1. Siga o [Anexo A](#anexo-a-criar-o-container-server-no-gtm-e-copiar-o-código-de-configuração) (escolha **Manually provision tagging server** e copie o token).
2. Volte ao Addingwell, cole o token no campo e clique em **Next**.
   *Importante:* um container Server que já tenha sido provisionado no Google Cloud **não pode** ser vinculado. Se o container já foi provisionado em outro lugar (por exemplo o da Stape), crie um **novo** container Server para o Addingwell.

**Etapa 3. Subdomínio e DNS**

1. Digite o seu domínio e o subdomínio do servidor. Use um subdomínio do seu domínio principal para manter os cookies *first-party*.
2. Evite nomes que bloqueadores reconhecem, como `data`, `gtm`, `sgtm`, `analytics`, `tracking`, `collect`. Prefira um nome da marca ou um prefixo sem significado (ex.: `s7b3.seudominio.com.br`).
3. Clique em **Next**.
4. O Addingwell mostra os **registros DNS** a criar. Crie-os no seu provedor de DNS. Os valores aparecem no painel (não na documentação), então copie exatamente. Se preferir, o painel oferece um **modelo de e-mail** para enviar ao seu webmaster.
5. Aguarde a propagação (5 minutos a 1 hora). O painel mostra um status de espera.

**Etapa 4. Provisionamento**

1. Quando o DNS propagar, o servidor é criado automaticamente.
2. Você recebe um **e-mail** avisando que o servidor está pronto, e parte da interface é liberada.

**Etapa 5. Ligar o GTM e testar**

1. Siga o [Anexo B](#anexo-b-apontar-o-gtm-para-a-nova-url-do-servidor).

**Fontes:** [Create a Container](https://docs.addingwell.com/configure-server-side-environment-addingwell-workspace) · [Planos](https://www.addingwell.com/plans)

---

## Método 3. Google Cloud Run (provisionamento automático do GTM)

**Por que é a opção "oficial":** é o caminho do próprio Google. Você paga direto à Google, sem intermediário.
**Custo.** Aproximadamente **US$ 45 por servidor/mês** (1 vCPU, 0,5 GB, CPU sempre alocada). O Google recomenda **no mínimo 2 servidores** (≈ US$ 90/mês). Também há custos de rede/domínio. Fonte: [Google](https://developers.google.com/tag-platform/tag-manager/server-side/cloud-run-setup-guide). Para volume pequeno, **sai mais caro que o Stape**.
**Pré-requisitos** (segundo o Google): conta do Google Cloud, conta de faturamento (criá-la exige o papel *Billing Account Creator*), e os papéis *Project Creator* e *Billing Account User*.

### Macro etapas

1. Criar conta do Google Cloud com faturamento.
2. Criar o container Server no GTM e escolher o provisionamento automático.
3. Ajustar o serviço no Cloud Run (instâncias mínimas) e criar um alerta de orçamento.
4. Mapear o domínio personalizado.
5. Apontar o GTM para o servidor e testar.

### Passo a passo detalhado

**Etapa 1. Google Cloud**

1. Crie (ou use) uma conta no Google Cloud Console e **ative o faturamento** (cartão).
2. Confirme que seu usuário tem os papéis *Project Creator* e *Billing Account User*.
3. Crie um **alerta de orçamento** (o Google recomenda configurar um alerta de faturamento para evitar surpresas). ⚠️ Não verifiquei o caminho exato de menu para isso; no Console, procure por **Faturamento → Orçamentos e alertas**.

**Etapa 2. Provisionamento automático no GTM**

1. No GTM, crie o container **Server** (passos 1 a 4 do [Anexo A](#anexo-a-criar-o-container-server-no-gtm-e-copiar-o-código-de-configuração)).
2. Na tela de provisionamento, escolha a opção de **provisionamento automático** (o contrário de *Manually provision tagging server*) e selecione a conta de faturamento. O GTM cria um projeto no Google Cloud e um serviço no Cloud Run. ⚠️ A documentação oficial só mostra esses passos em uma aba que não consegui ler; o nome exato do botão e as telas intermediárias não foram confirmados. Siga o assistente na tela. Fonte: [guia do Google, aba "Provisionamento automático"](https://developers.google.com/tag-platform/tag-manager/server-side/cloud-run-setup-guide).

**Etapa 3. Ajustar o serviço**

1. Abra o **Cloud Run** no Console do Google Cloud.
2. Selecione o serviço criado.
3. Clique em **Edit & Deploy New Revision** (Editar e implantar nova revisão).
4. Ajuste o número mínimo de instâncias (o Google recomenda **mínimo de 2** para resiliência; o exemplo oficial usa `--min-instances 2` e `--max-instances 10`).
5. Clique em **Deploy**.

**Etapa 4. Domínio personalizado**

1. Configure um domínio personalizado no Cloud Run seguindo a [documentação do Cloud Run sobre domínios](https://cloud.google.com/run/docs/mapping-custom-domains). ⚠️ Não li essa página. Segundo o guia do Simo Ahava, o mapeamento de domínio só existe em algumas regiões; confirme se a região escolhida (o [docs/04](docs/04-gtm-server.md) sugere `southamerica-east1`) o oferece, senão será preciso um balanceador de carga (custo extra).
2. Mapeie o domínio **só no serviço de produção**, não no de depuração (preview), segundo o Simo Ahava.

**Etapa 5. Ligar o GTM e testar**

1. Siga o [Anexo B](#anexo-b-apontar-o-gtm-para-a-nova-url-do-servidor).

**Fontes:** [Google: guia Cloud Run](https://developers.google.com/tag-platform/tag-manager/server-side/cloud-run-setup-guide) · [Google: planejamento de custos](https://developers.google.com/tag-platform/learn/sst-fundamentals/7-planning-infrastructure) · [Simo Ahava](https://www.simoahava.com/gtmtips/setup-google-tag-manager-server-cloud-run/)

---

## Método 4. Cloudflare Zaraz (substitui o GTM Server)

**Isto não é uma hospedagem do GTM Server.** O Zaraz é a ferramenta de tags do Cloudflare, que roda na borda da Cloudflare. Você **não usa o container Server do GTM**; reconfigura o rastreamento dentro do Cloudflare. Os documentos [docs/03](docs/03-gtm-web.md) e [docs/04](docs/04-gtm-server.md) deixam de valer para esse caminho.

**Custo.** Todas as contas têm **1.000.000 de eventos Zaraz/mês grátis**. Acima disso: US$ 5 por milhão extra com o plano *Zaraz Paid*. **Sem o plano pago, ao passar de 1 milhão o Zaraz é desativado até o próximo ciclo** (há alertas por e-mail a 50%, 80% e 90%). Fonte: [Cloudflare](https://developers.cloudflare.com/zaraz/pricing-info/).

**Limitações importantes.**
- Segundo o teste de Jon Loomer, o Zaraz **envia só eventos server-side**, sem substituir o Pixel do navegador. ⚠️ O artigo é antigo.
- **Deduplicação** com o Pixel não está resolvida na documentação que li: o autor ainda buscava solução (ligada a `external_id`). Como o objetivo do projeto é EMQ 9+ com `event_id` idêntico no Pixel e na CAPI, **valide a deduplicação no Events Manager antes de confiar nesse caminho**.
- Dados de usuário (e-mail, telefone etc.) e os campos que o projeto envia à CAPI: ⚠️ não consegui confirmar quais o Zaraz aceita.

### Macro etapas

1. Colocar o site atrás da Cloudflare (ou usar o modo sem proxy).
2. Adicionar a ferramenta Meta (Facebook Pixel / Conversions API) no Zaraz.
3. Configurar as ações (PageView, eventos, e-commerce).
4. Testar no Events Manager e verificar deduplicação.

### Passo a passo detalhado

**Etapa 1. Cloudflare**

1. Tenha uma conta Cloudflare e o seu site **com proxy pela Cloudflare** (a Cloudflare recomenda). Isso normalmente envolve trocar os *nameservers* do domínio para os da Cloudflare, o que afeta **todo o DNS**: faça com cuidado e revise os registros importados.
2. Se não puder usar o proxy, a Cloudflare tem o guia "Use Zaraz on domains not proxied by Cloudflare". ⚠️ Não li.

**Etapa 2. Adicionar a ferramenta**

1. No painel da Cloudflare, abra a página **Tag Setup** (Zaraz) do seu site.
2. Se você já adicionou alguma ferramenta antes, clique em **Third-party tools**.
3. Clique em **Add new tool**.
4. No catálogo, procure a ferramenta da Meta (o nome pode ser "Facebook Pixel" ou parecido ⚠️ não confirmei no catálogo) e clique em **Continue**.
5. Em **Set up**, informe os campos exigidos pela ferramenta. Segundo um plugin de terceiros (Zbridge), a receita da Meta pede o **token de acesso da Conversions API**; o Pixel ID também deve ser pedido ⚠️. Para gerar o token: Meta **Events Manager → Fontes de dados → seu Pixel → Configurações → seção API de Conversões → Gerar token de acesso** (copie na hora: a Meta não guarda o token).
6. Em **Actions**, escolha o que a ferramenta fará: **Pageviews**, **Events** ou **E-Commerce**. Se a ferramenta não aceitar *Automatic Actions*, use *Custom Actions* (com *triggers* criados antes).
7. Clique em **Save**.

**Etapa 3. Testar**

1. Os eventos do Zaraz **não aparecem** no Pixel Helper. Use **Events Manager → Testar eventos** (a página de eventos de teste do Pixel).
2. Confira se um mesmo evento chega **uma única vez** (deduplicação).

**Fontes:** [Cloudflare: pricing](https://developers.cloudflare.com/zaraz/pricing-info/) · [Cloudflare: get started](https://developers.cloudflare.com/zaraz/get-started/) · [Cloudflare: actions e triggers](https://developers.cloudflare.com/zaraz/custom-actions/) · [Jon Loomer: Zaraz e CAPI](https://www.jonloomer.com/testing-zaraz-to-set-up-facebook-conversions-api/) · [Meta: começar com a CAPI (token)](https://developers.facebook.com/docs/marketing-api/conversions-api/get-started)

---

## Método 5. Meta Conversions API Gateway (só para a Meta)

**O que é:** um serviço **da própria Meta** que roda **na sua conta de nuvem** (a documentação cita a AWS como exemplo). Ele recebe os eventos do navegador e os envia à Meta por CAPI, gerando `event_id` para deduplicar. **Só atende a Meta**: GA4 e Google Ads continuam precisando de outro caminho. Também não usa o GTM Server.

**Custo.** O software é gratuito; você paga a nuvem. A Meta estima, em us-west-2: **~US$ 39/mês para 10 milhões de eventos**, ~US$ 84 para 250 milhões, ~US$ 600 para 2,5 bilhões. O orçamento padrão do stack é US$ 50/mês. Para sites pequenos o custo fixo é alto frente ao Stape (US$ 0 a 20). Fonte: [Meta: arquitetura (ECS Express)](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/architecture).

⚠️ **Não consegui ler o passo a passo detalhado de instalação** (as páginas da Meta que abri só mostram a visão geral). Por isso o roteiro abaixo é de **macro etapas confirmadas**, sem cliques inventados. Para os cliques, use o guia oficial: [Gateway na AWS ECS Express](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express) (a Meta indica ~25 minutos de implantação).

**Alternativa gratuita para quem só precisa da Meta:** a própria Meta informa que a Conversions API pode ser **ativada no Events Manager sem hospedar nada** (integração direta/parceiro). Vale testar antes de montar um Gateway. Fonte: [Meta: Conversions API Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway).

### Macro etapas (confirmadas na documentação)

1. Ter uma conta de nuvem de terceiros (ex.: AWS) e o Pixel da Meta.
2. Provisionar a instância do Gateway na sua nuvem (via o fluxo do Events Manager / guia ECS Express).
3. Criar a entrada de DNS do endpoint do Gateway (domínio próprio).
4. Apontar o Pixel da Meta para o endpoint do Gateway.
5. Adicionar seus domínios e Pixels durante a implantação.
6. Gerenciar e monitorar pelo painel administrativo em `/hub/capig`.

### Detalhamento

Use o guia oficial acima para cada etapa. Itens da própria Meta a considerar:
- O stack cria vários serviços AWS (CloudFront, DynamoDB, Cognito, S3, Lambda, ECS Express, CloudWatch, KMS e outros).
- Os logs ficam 5 dias e há um alerta de orçamento de US$ 50/mês por padrão.
- Dados de eventos e de clientes só **passam** pelo Gateway (não são armazenados).

**Fontes:** [Meta: Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway) · [Meta: arquitetura ECS Express](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/architecture)

---

## Método 6. VPS próprio com Docker (autohospedado)

**O mais barato e o mais trabalhoso.** Você roda a imagem oficial do Google em um servidor virtual comum. Você é responsável por HTTPS, atualizações, reinício em caso de falha e monitoramento.

**Custo.** Um VPS básico (2 vCPU, 4 GB) na Hetzner aparece entre **€4 e €6/mês** + ~€0,50 de IPv4, mas as fontes que encontrei **divergem** (preços subiram em 2026). Confirme em hetzner.com/cloud. Fontes: [Cloud Pricing Comparison 2026-08](https://kimmo.suominen.com/stuff/cpc-2026-08.txt), [agentdeals.dev](https://agentdeals.dev/hetzner-pricing-2026). Qualquer VPS com Docker serve; a Hetzner é só um exemplo.

**Riscos que você assume.**
- A documentação do Google pede rodar como **cluster** (várias instâncias) para ter disponibilidade e **máx. 1 vCPU por instância**. Um único VPS não tem redundância: se cair, **você perde eventos**.
- Os servidores precisam ser reiniciados periodicamente para receber atualizações do código do GTM Server.
- Para o público brasileiro, escolha um VPS com baixa latência ao Brasil.
- Escolha um plano **x86 (não ARM)**: a imagem oficial é só amd64.
- "Ilimitado" aqui significa **sem limite contratual**: o teto real é a capacidade da máquina (o Google indica ≤ 1 vCPU por instância; um VPS maior ou um segundo VPS aumenta a capacidade). Não medi quantas requisições/s um VPS de ~2 vCPU aguenta.

### Macro etapas

1. Contratar o VPS e instalar o Docker.
2. Criar o container Server no GTM (provisionamento manual) e copiar o código de configuração.
3. Subir o **servidor de preview** (1 instância) e o **servidor de tagging**.
4. Colocar HTTPS na frente dos dois e criar os registros DNS.
5. Apontar o GTM para o servidor e testar.
6. Rotina de atualização.

### Passo a passo detalhado

**Etapa 1. VPS e Docker**

1. Contrate um VPS Linux (ex.: Ubuntu) e anote o IP público.
2. Conecte por SSH e **instale o Docker** seguindo a [documentação oficial do Docker](https://docs.docker.com/engine/install/). ⚠️ Não é parte da documentação do Google e não a li.

**Etapa 2. Código de configuração**

1. Siga o [Anexo A](#anexo-a-criar-o-container-server-no-gtm-e-copiar-o-código-de-configuração) e copie o código de configuração (`CONTAINER_CONFIG`).

**Etapa 3. Subir os dois containers** (imagem oficial `gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable`)

O Google exige **dois papéis** com a mesma imagem e variáveis diferentes:

1. **Servidor de preview** (exatamente 1 instância, sem autoescala):

   ```bash
   docker run -d --name sgtm-preview --restart unless-stopped \
     -p 8081:8080 \
     -e CONTAINER_CONFIG='COLE_AQUI_O_CODIGO' \
     -e RUN_AS_PREVIEW_SERVER=true \
     gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable
   ```

2. **Servidor de tagging** (o que recebe os eventos reais):

   ```bash
   docker run -d --name sgtm-tagging --restart unless-stopped \
     -p 8080:8080 \
     -e CONTAINER_CONFIG='COLE_AQUI_O_CODIGO' \
     -e PREVIEW_SERVER_URL='https://preview.seudominio.com.br' \
     gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable
   ```

   Pontos da documentação do Google: a porta interna padrão é **8080** (por isso o mapeamento `8081:8080` acima, só para não colidir no mesmo VPS); o `CONTAINER_CONFIG` deve ser **idêntico** nos dois; `PREVIEW_SERVER_URL` é a URL **HTTPS** do preview; a verificação de saúde é `/healthy` (retorna 200). As flags `-d`, `--restart` e `--name` são do Docker e não vêm da doc do Google.

**Etapa 4. HTTPS e DNS**

1. Crie dois registros **A** no seu DNS apontando para o IP do VPS: `server` (tagging) e `preview` (preview). Se o DNS for Cloudflare, deixe o proxy desligado (nuvem cinza), como no [docs/04](docs/04-gtm-server.md).
2. Coloque um proxy reverso com HTTPS automático na frente. Uma opção é o **Caddy**, mencionado na ferramenta comunitária *tagdock* para esse fim. Exemplo de `Caddyfile`:

   ```
   server.seudominio.com.br {
       reverse_proxy localhost:8080
   }
   preview.seudominio.com.br {
       reverse_proxy localhost:8081
   }
   ```

   ⚠️ Esse arquivo é um exemplo meu, **não saiu da documentação do Google**; não o testei. Requisito do Google: se houver balanceador/CDN na frente do preview, o **timeout deve ser maior que 20 segundos**, ou o modo de preview falha.

**Etapa 5. Ligar o GTM e testar**

1. Siga o [Anexo B](#anexo-b-apontar-o-gtm-para-a-nova-url-do-servidor) (a URL do servidor é a do tagging).
2. No GTM Server, clique em **Visualizar** e envie uma requisição ao servidor de tagging. Se ela aparecer na tela de preview, está funcionando.

**Etapa 6. Atualizações**

1. Periodicamente, baixe a imagem `:stable` mais recente e **recrie** os dois containers com as mesmas variáveis (o Google pede atualizar o preview e todas as instâncias com a imagem mais recente e desligar as antigas).

**Fontes:** [Google: configuração manual (Docker)](https://developers.google.com/tag-platform/tag-manager/server-side/manual-setup-guide) · [DigitalOcean: exemplo de `docker run`](https://www.digitalocean.com/community/questions/how-can-i-manually-set-up-a-google-tag-manager-gtm-server-side-on-digital-ocean)

---

## 3. Qual escolher

| Seu caso | Recomendação |
|---|---|
| **Seu caso:** Meta + GA4, requisições ilimitadas, menor custo | **VPS com Docker** (método 6). Comece, se quiser, no **Addingwell Free** (método 2). |
| Até ~100 mil req/mês, quer pagar o mínimo e manter o projeto como está | **Addingwell Free** (método 2). Confirme antes a região do servidor. |
| Quer algo muito parecido com a Stape, com servidor escolhido por região | **TAGGRS** (método 1). |
| Só usa a Meta e quer o mais simples possível | Teste primeiro a **CAPI ativada direto no Events Manager** (sem hospedagem). |
| Já paga Cloudflare e aceita refazer o rastreamento, com volume alto | **Zaraz** (método 4), só depois de validar a deduplicação. |
| Precisa de custo mínimo e aceita manutenção e menor redundância | **VPS com Docker** (método 6). |
| Quer ficar 100% no ecossistema Google | **Cloud Run** (método 3), sabendo que é mais caro. |

---

## Revisão: o que foi e o que não foi verificado

Revisei cada método contra as páginas consultadas. Resultado:

**Confirmado em documentação oficial (usado como passo):**
- Método 1: sequência "Add new setup → Automatic setup via Google → escolher conta/Web container → Create a new server container → Product name / Domain / Preferred server location → Create", e o registro DNS tipo A com o IP do painel, proxy do Cloudflare desligado, botão **Validate**.
- Método 2: sequência de cadastro, criação do Container, token, subdomínio, DNS, espera de 5 min a 1 h e e-mail de servidor pronto. Preços e limites da [página de planos](https://www.addingwell.com/plans).
- Método 3: pré-requisitos, custo (~US$ 45/servidor), mínimo de 2 instâncias, "Edit & Deploy New Revision", URL do servidor em Administrador → Configurações do contêiner, teste `/healthy`.
- Método 4: preços, limite, desativação acima do limite, caminho **Tag Setup → Third-party tools → Add new tool → Set up → Actions → Save** (página *Get started* da Cloudflare).
- Método 5: macro etapas, custos estimados pela Meta e arquitetura.
- Método 6: imagem, variáveis `CONTAINER_CONFIG`, `RUN_AS_PREVIEW_SERVER`, `PREVIEW_SERVER_URL`, porta 8080, `/healthy`, requisitos de cluster/HTTPS/timeout.

**NÃO verificado (marcado com ⚠️ no texto; confirme antes de executar):**
1. **Método 1:** moeda exata e valores mensal vs. anual do TAGGRS; regiões de servidor disponíveis; telas do passo "Set up automatically" na etapa de roteamento.
2. **Método 2:** região do servidor do plano Free; a quais planos se aplicam "1 domínio incluído / €10 por domínio extra"; valores dos registros DNS (só aparecem no painel).
3. **Método 3:** o nome exato dos botões do provisionamento automático no GTM; o caminho do menu de alertas de orçamento; os passos de mapeamento de domínio no Cloud Run e se a região `southamerica-east1` o suporta.
4. **Método 4:** nome da ferramenta Meta no catálogo do Zaraz, campos exatos (Pixel ID, token), suporte a dados de usuário e solução de deduplicação. **Não achei a página oficial da ferramenta Meta no Zaraz** (as URLs que tentei retornaram 404). Por isso esse método tem o menor grau de detalhe confirmado.
5. **Método 5:** todos os cliques de instalação (as páginas da Meta que abri não trazem o passo a passo).
6. **Método 6:** instalação do Docker, o `Caddyfile` e as flags `-d`/`--restart`/`--name` são exemplos meus, não da documentação do Google; o preço do VPS varia entre as fontes.
7. **Geral:** tratei a tag *Facebook Conversion API* da Galeria como compatível com qualquer container server (é uma tag de modelo comunitário do GTM), mas não conferi isso na documentação de cada hospedagem. Os recursos exclusivos da Stape (Stape Store, Cookie Keeper, Custom Loader) **não** existem nas outras.

Por fim, os preços do Stape no [docs/04](docs/04-gtm-server.md) ("a partir de ~R$ 100") estão desatualizados em relação à página atual (Pro US$ 17–20/mês). Posso corrigir isso, se quiser.
