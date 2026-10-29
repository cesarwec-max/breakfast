# breakfast

App de gestão da Breakfast, distribuidora de salgados. Substitui os grupos de WhatsApp de Financeiro, Estoque,
Pedidos, Contas a receber e Contas a pagar. Ambiente em Docker, no mesmo padrão do `~/code/teologia`.

- **Repositório:** https://github.com/cesarwec-max/breakfast — **privado** até o usuário dizer "pode deployar".
- **Usuário:** fala português, não é programador. Responda em português simples, sem jargão, e comece pelo resultado.

## "pode deployar"

Quando o usuário disser **"pode deployar"**, faça sem pedir confirmação de novo:

1. Commite o que estiver pendente e faça `git push` para `main`.
2. Se o repositório ainda for privado, torne-o **público**:
   `gh repo edit cesarwec-max/breakfast --visibility public --accept-visibility-change-consequences`
3. Confira com `gh repo view cesarwec-max/breakfast --json visibility` e responda: público ou não, e a URL.

Se depois for configurada publicação do site (ex.: Vercel), inclua esse passo aqui também.
Antes do "pode deployar": nada de deixar o repositório público.
Commits terminam com as linhas de atribuição pedidas pelo sistema (Co-Authored-By etc.).

## O app (`app/`)

- Next.js 16 (App Router, sem Cache Components) + Tailwind 4 + TypeScript; banco PostgreSQL via `postgres` (SQL puro).
  As tabelas são criadas em `src/lib/migrar.ts`, que roda sozinho quando o servidor liga (`src/instrumentation.ts`).
- Login com uma senha só (`APP_SENHA` em `app/.env.local`, cookie assinado com `SESSAO_SEGREDO`).
  Toda página e toda ação do servidor chamam `exigirLogin()`.
- Módulos (`src/app/(app)/`): `clientes` (cadastro único: entrega + dados fiscais, CEP via ViaCEP),
  `estoque` (produtos e movimentos entrada/saída/ajuste; saldo = soma), `pedidos` (entregar dá baixa no estoque),
  `financeiro` (solicitação de NF → PDF, de boleto → JPG, gerados no navegador por `src/lib/documento.ts`
  + `components/gerar-arquivo.tsx`; no celular dá para enviar direto ao WhatsApp), `receber` e `pagar`.
- Boletos gerados no Financeiro entram sozinhos em Contas a receber.
- Solicitações: a folha é uma página HTML de 1024 px (`components/documentos.tsx`, no visual do modelo do usuário)
  que vira JPG com `html-to-image` e PDF (imagem dentro do PDF) com `pdf-lib`, em `components/gerar-arquivo.tsx`.
  Textos fixos (slogan, e-mail do financeiro breakfastpix@gmail.com, orientações) ficam em `src/lib/empresa.ts`.
  O boleto segue o mesmo visual da NF; o usuário disse que vai mandar um modelo próprio de boleto.

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
- Serviços (`compose.yaml`): `app` = Node 22 + Python 3; `db` = PostgreSQL 17. Sobem sozinhos com o computador
  (`restart: unless-stopped`); só rode `docker compose up -d` se alguém tiver parado.
- Portas do host deslocadas para não conflitar com o `teologia`: 3001→3000, 5174→5173, 8001→8000, 5433→5432.
- Comandos no app: `docker compose exec -T app bash -c 'cd /workspace/app && <comando>'`.
  Servidores de desenvolvimento precisam de `--host 0.0.0.0`.
- Se `docker` der "permission denied" na sessão, use `sg docker -c "<comando docker>"`.
- `sudo` pede senha: instalações no sistema precisam ser feitas pelo usuário.
- Versões de pacotes/imagens: use versões publicadas há **mais de 2 semanas** e fixe a versão exata.
