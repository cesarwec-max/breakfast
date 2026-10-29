# breakfast

App de gestão da Breakfast, distribuidora de salgados. Substitui os grupos de WhatsApp de Financeiro, Estoque,
Pedidos, Contas a receber e Contas a pagar. Ambiente em Docker, no mesmo padrão do `~/code/teologia`.

- **Produção:** https://breakfastdistribuidora.vercel.app (Vercel, projeto `breakfast`, pasta `app/`, região gru1).
  O endereço automático `breakfast-dusky.vercel.app` também funciona; `breakfast.vercel.app` é de **outra pessoa**.
- **Banco de produção:** Neon `breakfast-db` (São Paulo), criado pela integração da Vercel; `DATABASE_URL` vem de lá.
  As tabelas se criam sozinhas ao ligar o servidor (`src/lib/migrar.ts`).
- **Repositório:** https://github.com/cesarwec-max/breakfast (público). Push para `main` = publicação automática na Vercel.
- **Usuário:** fala português, não é programador. Responda em português simples, sem jargão, e comece pelo resultado.

## Regras importantes

1. **Nunca publique sem ouvir "pode deployar".** Faça as mudanças, teste em http://localhost:3001 e commite localmente.
   Nada de push para `main` fora do "pode deployar".
2. Produção tem dados reais da empresa: não rode comandos que apaguem ou alterem dados no banco de produção
   sem o usuário pedir. Para testar, use o banco local (contêiner `db`).
3. O endereço de produção não é ambiente de teste: não digite a senha nele; o usuário faz login.

## "pode deployar"

Quando o usuário disser **"pode deployar"**, publique sem pedir confirmação de novo:

1. `bash scripts/deploy.sh "<mensagem de commit em português>"` (da raiz do projeto)
   - roda tipos, lint e build no contêiner; se falhar, **pare**, corrija e tente de novo;
   - commita tudo, faz `git push` para `main` e espera a Vercel publicar.
2. Confira com `curl` que https://breakfastdistribuidora.vercel.app/login responde 200 e diga: publicado ou não, a URL
   e o que mudou.

Variáveis na Vercel (produção): `APP_SENHA` (mesma de `app/.env.local`), `SESSAO_SEGREDO`, `DATABASE_URL` (Neon).
Ver/alterar: `docker compose exec -T app vercel env ls`. Falha na Vercel:
`docker compose exec -T app vercel inspect <url> --logs`. Plano da Vercel: Hobby (gratuito); o usuário foi avisado
que uso comercial pede o plano Pro.

## O app (`app/`)

- Next.js 16 (App Router, sem Cache Components) + Tailwind 4 + TypeScript; banco PostgreSQL via `postgres` (SQL puro).
  As tabelas são criadas em `src/lib/migrar.ts`, que roda sozinho quando o servidor liga (`src/instrumentation.ts`).
- Login com uma senha só (`APP_SENHA` em `app/.env.local`, cookie assinado com `SESSAO_SEGREDO`).
  Toda página e toda ação do servidor chamam `exigirLogin()`.
- Módulos (`src/app/(app)/`): `clientes` (cadastro único: entrega + dados fiscais, CEP via ViaCEP),
  `estoque` (produtos e movimentos entrada/saída/ajuste; saldo = soma), `pedidos` (entregar dá baixa no estoque),
  `financeiro` (solicitação de NF → PDF, de boleto → JPG, gerados no navegador por `components/gerar-arquivo.tsx`;
  no celular dá para enviar direto ao WhatsApp), `receber` e `pagar`.
- Boletos gerados no Financeiro entram sozinhos em Contas a receber.
- **Anexos** (notas, boletos, XML devolvidos pelo financeiro): tabela `anexos`, arquivo guardado no próprio banco
  (`bytea`), ligado ao pedido (ou à conta a receber, se ela não veio de um pedido). Envio por ação do servidor
  (`app/(app)/anexos-actions.ts`, até 4 MB; fotos grandes são reduzidas no navegador), download só com login em
  `/anexos/[id]`. Aparecem no pedido, em Contas a receber (pelo pedido de origem do boleto) e na ficha do cliente.
  Regras em `src/lib/anexos.ts` (PDF, XML e fotos; SVG não é aceito; XML sempre baixa, nunca abre na tela).
  O Neon gratuito tem 0,5 GB: acompanhe o espaço se o volume de anexos crescer.
- Em **Contas a pagar** também há anexos (nota e boletos da fábrica): `anexos.conta_pagar_id`, sem cliente.
  Parcelas lançadas juntas ficam no mesmo `contas_pagar.lote` e mostram os mesmos anexos. Ao excluir uma parcela,
  os anexos passam para outra do mesmo lote; se era a única, são apagados junto (o aviso de confirmação diz isso).
- **Solicitação de NF (para o contador):** A4 simples, cópia fiel do modelo do usuário
  `Solicitacao_NF_SPORT_BAR_MOOCA_R69500_FINAL.pdf` (tabelas, faixa laranja do total, "Instruções ao contador").
  PDF de **texto** (Helvetica, selecionável) feito com `pdf-lib` em `src/lib/nf-contador.ts`; prévia em HTML com as
  mesmas medidas em `components/folha-nf-contador.tsx`. Nome do arquivo: `Solicitacao_NF_<RAZAO>_R<centavos>.pdf`.
  **Não mude o layout sem o usuário pedir: o contador está acostumado com ele.**
- **Solicitação de boleto:** folha de 1024 px com a arte da marca (`components/documentos.tsx`) que vira JPG com
  `html-to-image`. O usuário aprovou como está.
- Textos fixos (slogan, e-mail do financeiro breakfastpix@gmail.com) ficam em `src/lib/empresa.ts`.

## Identidade visual

- Cores: grafite (#232325 / #3c3c3f) e laranja em degradê (#f7941d → #ea4316, classes `bg-marca` e `texto-marca`).
- Fontes: Poppins (app) e Oswald (títulos condensados das solicitações), via `next/font`.
- Logo: `public/marca/simbolo.png` (cinza, fundo claro), `simbolo-branco.png` (fundo escuro), ícones do app em
  `public/marca/icone-*.png`, `src/app/icon.png` e `apple-icon.png`. Componente `components/logo.tsx`.
- Slogan: "Distribuindo sabor e praticidade".
- Testar: `npx tsc --noEmit && npm run lint && npm run build`, depois `npm run start` e abrir http://localhost:3001.
  Para parar o servidor: `docker compose restart app` (não use `pkill -f "next start"` dentro de `bash -c`, mata o próprio comando).

## Ambiente

- Zorin OS. Docker, Git e GitHub CLI (`gh`, conta `cesarwec-max`) no host. **Node/npm não existem no host** — tudo roda no contêiner.
- Serviços (`compose.yaml`): `app` = Node 22 + Python 3 + Vercel CLI 64.0.2 (login no volume `teologia_vercel_auth`,
  compartilhado com o projeto teologia; conta `cesarwec-9227`); `db` = PostgreSQL 17. Sobem sozinhos com o computador
  (`restart: unless-stopped`); só rode `docker compose up -d` se alguém tiver parado.
- Portas do host deslocadas para não conflitar com o `teologia`: 3001→3000, 5174→5173, 8001→8000, 5433→5432.
- Comandos no app: `docker compose exec -T app bash -c 'cd /workspace/app && <comando>'`.
  Servidores de desenvolvimento precisam de `--host 0.0.0.0`.
- Se `docker` der "permission denied" na sessão, use `sg docker -c "<comando docker>"`.
- `sudo` pede senha: instalações no sistema precisam ser feitas pelo usuário.
- Versões de pacotes/imagens: use versões publicadas há **mais de 2 semanas** e fixe a versão exata.
