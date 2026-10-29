# breakfast

App de gestão da Breakfast (distribuidora de salgados): pedidos, estoque, financeiro
(solicitações de nota fiscal em PDF e de boleto em JPG), contas a receber e contas a pagar.

Ambiente de desenvolvimento com Docker (Node.js 22 + Python 3 + PostgreSQL 17).

## Ligar o app

```bash
docker compose exec -d app bash -c 'cd /workspace/app && npm run build && npm run start > /tmp/next.log 2>&1'
```

Abra http://localhost:3001. A senha fica em `app/.env.local` (`APP_SENHA`).
No celular, na mesma rede Wi-Fi: `http://<IP deste computador>:3001`.

## Uso diário

```bash
docker compose up -d --build     # sobe o ambiente (só na 1ª vez; depois ele liga sozinho com o computador)
docker compose exec app bash     # entra no contêiner para rodar npm, python etc.
docker compose down              # desliga tudo
```

- O código fica em `app/` (dentro do contêiner: `/workspace/app`).
- Portas no seu computador → contêiner:
  - http://localhost:3001 → 3000 (React/Next/Express)
  - http://localhost:5174 → 5173 (Vite)
  - http://localhost:8001 → 8000 (Python: FastAPI/Django)
  - `localhost:5433` → 5432 (PostgreSQL)
- Banco: `postgres://breakfast:breakfast@localhost:5433/breakfast` (de dentro do contêiner: `postgres://breakfast:breakfast@db:5432/breakfast`, já disponível em `$DATABASE_URL`).
- No VS Code, a extensão *Dev Containers* abre o projeto direto no contêiner.

> Dica: ao rodar um servidor de desenvolvimento, use `--host 0.0.0.0` para acessá-lo pelo navegador.
