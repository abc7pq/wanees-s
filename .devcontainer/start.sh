#!/usr/bin/env bash
# Runs every time the Codespace is opened: bring the copy up to date, rebuild if the code changed,
# start the visitor (3100) and organizer (3200) apps, and print the address to open on a phone.
set -euo pipefail
cd "$(dirname "$0")/.."

visitor="http://localhost:3100"
if [ -n "${CODESPACE_NAME:-}" ]; then
  domain="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  visitor="https://${CODESPACE_NAME}-3100.${domain}"
  # The browser sends this origin; the apps sit behind GitHub's forwarding proxy.
  export WANEES_ALLOWED_ORIGINS="${visitor},https://${CODESPACE_NAME}-3200.${domain}"
fi
banner() {
  printf '\n\033[35m════════════════════════════════════════════\033[0m\n'
  printf '  %s\n\n  %s/e/boulevard-world-demo\n' "$1" "$visitor"
  printf '\033[35m════════════════════════════════════════════\033[0m\n\n'
}

# Already running: keep it, unless newer work has been pushed since it started.
git fetch --quiet 2>/dev/null || true
behind="$(git rev-list --count 'HEAD..@{u}' 2>/dev/null || echo 0)"
if curl -fsS -o /dev/null http://127.0.0.1:3100/api/health 2>/dev/null; then
  if [ "$behind" = "0" ]; then banner "ونيس شغّال. افتح هذا الرابط من جوالك:"; exit 0; fi
  echo "▸ ${behind} new commit(s): restarting on the latest version"
  pkill -f "scripts/local.mjs start" 2>/dev/null || true
  pkill -f "next-server" 2>/dev/null || true
  sleep 2
fi

[ -f app/.env.local ] || bash .devcontainer/create.sh

# Latest pushed work, when this checkout can fast-forward to it.
before="$(git rev-parse HEAD)"
git pull --ff-only 2>/dev/null || true
sha="$(git rev-parse HEAD)"
if [ "$before" != "$sha" ]; then
  # New dependencies arrive with a changed lockfile; install only where one changed.
  for dir in . app admin; do
    if git diff --name-only "$before" "$sha" -- "$dir/package-lock.json" | grep -q .; then
      (cd "$dir" && npm ci --no-audit --no-fund)
    fi
  done
fi

if [ "$(cat app/.next/WANEES_SHA 2>/dev/null || true)" != "$sha" ]; then
  echo "▸ Building both apps for ${sha:0:7} (a few minutes the first time)"
  npm run db:generate
  npm run build --prefix app
  npm run build --prefix admin
  echo "$sha" > app/.next/WANEES_SHA
fi

banner "رابط ونيس على جوالك (يفتح بعد ما يكتمل التشغيل بالأسفل):"
exec npm run start:local
