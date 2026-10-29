# breakfast

Projeto web novo (ainda sem código do app). Ambiente de desenvolvimento em Docker, no mesmo padrão do `~/code/teologia`.

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
