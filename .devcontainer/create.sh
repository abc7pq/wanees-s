#!/usr/bin/env bash
# First boot of the Codespace: wait for PostgreSQL, then the project's own one-command setup
# (dependencies, local env files with fresh random secrets, migrations, demo seed).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▸ Waiting for PostgreSQL"
for _ in $(seq 1 90); do
  if (exec 3<>/dev/tcp/127.0.0.1/5432) 2>/dev/null; then break; fi
  sleep 1
done

npm run setup
