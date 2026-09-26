#!/usr/bin/env bash
# Warns when a running Docker image is older than the source it was built
# from — `docker compose up -d` (no --build) silently reuses a stale image
# instead of erroring, which is exactly what happened to
# CurriculumTierSummary: edited today, but the frontend image was built
# yesterday, so the container kept serving yesterday's bundle with no
# indication anything was wrong.
set -euo pipefail

check_service() {
  local service="$1"
  shift
  local paths=("$@")

  local image="eduanalyze-ai-${service}"
  local image_created
  if ! image_created=$(docker image inspect "$image" --format '{{.Created}}' 2>/dev/null); then
    echo "⚪ ${service}: no local image found (never built, or removed) — skipping"
    return
  fi
  # Docker's .Created is always UTC (Z suffix) — must parse with -u on BSD
  # date, otherwise it's silently read as local time, which on a UTC+N
  # host makes every image look N hours newer/older than it really is.
  local image_epoch
  image_epoch=$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "${image_created%%.*}" "+%s" 2>/dev/null \
    || date -u -d "$image_created" "+%s")

  local newest_file=""
  local newest_epoch=0
  for p in "${paths[@]}"; do
    [ -e "$p" ] || continue
    while IFS= read -r -d '' f; do
      local ep
      ep=$(stat -f "%m" "$f" 2>/dev/null || stat -c "%Y" "$f")
      if [ "$ep" -gt "$newest_epoch" ]; then
        newest_epoch="$ep"
        newest_file="$f"
      fi
    done < <(find "$p" -type f -not -path '*/node_modules/*' -print0)
  done

  if [ "$newest_epoch" -gt "$image_epoch" ]; then
    echo "⚠️  ${service}: STALE — image built $(date -r "$image_epoch" '+%Y-%m-%d %H:%M'), but $newest_file changed $(date -r "$newest_epoch" '+%Y-%m-%d %H:%M')"
    echo "   Run: npm run docker:rebuild:${service}"
  else
    echo "✅ ${service}: image is up to date (built $(date -r "$image_epoch" '+%Y-%m-%d %H:%M'))"
  fi
}

check_service "backend" apps/backend/src apps/backend/package.json apps/backend/Dockerfile apps/backend/prisma packages/shared-types/src
check_service "frontend" apps/frontend/src apps/frontend/package.json apps/frontend/Dockerfile packages/shared-types/src
