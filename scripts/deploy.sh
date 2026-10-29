#!/usr/bin/env bash
# Publica em produção: testa, faz commit, envia para main e espera a Vercel terminar.
# Uso: bash scripts/deploy.sh "mensagem do commit"
set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-Atualização}"
URL="https://breakfastdistribuidora.vercel.app"

# docker sem sudo; se o grupo ainda não estiver ativo nesta sessão, usa sg
dc() {
  if docker info >/dev/null 2>&1; then docker compose "$@"; else sg docker -c "docker compose $(printf '%q ' "$@")"; fi
}

echo "==> Subindo o ambiente"
dc up -d >/dev/null

echo "==> Tipos, lint e build"
dc exec -T app bash -c 'cd /workspace/app && npm ci --no-audit --no-fund && npx tsc --noEmit && npm run lint && npm run build'

echo "==> Commit e push para main"
git checkout main >/dev/null 2>&1 || true
git add -A
if ! git diff --cached --quiet; then
  git commit -m "$MSG" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
fi
git push origin main

SHA=$(git rev-parse HEAD)

echo "==> Aguardando a Vercel publicar o commit ${SHA:0:7}"
for _ in $(seq 1 90); do   # até ~15 minutos
  LINE=$(dc exec -T app vercel api "/v6/deployments?projectId=breakfast&target=production&limit=20" --raw 2>/dev/null \
    | python3 -c '
import json, sys
sha = sys.argv[1]
for d in json.load(sys.stdin).get("deployments", []):
    if d.get("meta", {}).get("githubCommitSha") == sha:
        print(d.get("state") or d.get("readyState"), d.get("inspectorUrl", ""))
        break
' "$SHA" || true)
  STATE=${LINE%% *}
  case "$STATE" in
    READY)
      echo "✅ Publicado em produção: $URL"
      exit 0 ;;
    ERROR|CANCELED)
      echo "❌ A publicação falhou ($STATE). Detalhes: ${LINE#* }"
      exit 1 ;;
  esac
  sleep 10
done

echo "⚠️  A Vercel não confirmou a publicação a tempo. Veja em https://vercel.com/dashboard"
exit 1
