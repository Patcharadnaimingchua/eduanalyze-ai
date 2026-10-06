#!/usr/bin/env bash
# Dumps the dev database to apps/backend/.backups/ (git-ignored: it holds real
# user data) as eduanalyze_ai_<YYYYMMDD>_<HHMMSS>_<label>.dump, custom format.
# Usage: npm run db:backup -- <label>     (label defaults to "manual")
# Read-only against the database; the dump is checked with pg_restore --list.
set -euo pipefail

label="${1:-manual}"
label="${label//[^A-Za-z0-9._-]/-}"
dir="apps/backend/.backups"
file="${dir}/eduanalyze_ai_$(date +%Y%m%d_%H%M%S)_${label}.dump"

mkdir -p "$dir"
if ! docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$file"; then
  rm -f "$file"
  echo "db:backup failed: is the postgres container running? (docker compose up -d postgres)" >&2
  exit 1
fi

tables="$(docker compose exec -T postgres pg_restore --list < "$file" | grep -c 'TABLE DATA' || true)"
if [ "$tables" -lt 1 ]; then
  echo "db:backup wrote $file but it lists no tables; do not rely on it" >&2
  exit 1
fi
echo "db:backup ok: $file ($(wc -c < "$file" | tr -d ' ') bytes, $tables tables)"
