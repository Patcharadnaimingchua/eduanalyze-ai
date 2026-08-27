# Build context is the repo root (npm workspaces monorepo) — required so
# npm can resolve @eduanalyze-ai/shared-types via its workspace symlink.
# Run as: docker build -f apps/frontend/Dockerfile .

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not
# read at runtime — this MUST be a URL the browser can reach directly
# (e.g. http://localhost:3001, the backend's published host port), never
# a Docker-internal service hostname like http://backend:3001, which only
# resolves inside the compose network and is unreachable from the
# browser making the actual fetch calls.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build --workspace=apps/frontend

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/frontend/.next-build ./apps/frontend/.next-build
COPY --from=build /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=build /app/apps/frontend/next.config.mjs ./apps/frontend/next.config.mjs

EXPOSE 3000
WORKDIR /app/apps/frontend

# Invokes `next` directly rather than `npm run start --workspace=...` —
# that npm form needs the repo-root package.json (for workspace
# resolution) which this stage deliberately doesn't copy in, to keep the
# runtime image to just what's actually needed to serve the app.
# NEXT_BUILD_MODE=production matches what the start script sets (see
# apps/frontend/package.json) — required so Next reads .next-build, this
# project's custom distDir, not the default .next.
CMD ["sh", "-c", "NEXT_BUILD_MODE=production ../../node_modules/.bin/next start"]
