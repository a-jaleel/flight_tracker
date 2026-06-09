# Flight Tracker server + display.
#
# This image runs the Node server (which also serves the built web UI). Aircraft
# come from the free airplanes.live cloud API, so it needs no radio and no other
# hardware — just outbound internet access.

FROM node:22-bookworm-slim

# pnpm via corepack (version pinned by package.json "packageManager").
RUN corepack enable
WORKDIR /app

# Install only the deps the server + web actually need. Manifests first so this
# layer caches on the lockfile, not on source edits.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY web/package.json web/package.json
RUN pnpm install --frozen-lockfile --filter server --filter web --filter shared

# Source (node_modules excluded via .dockerignore) + production web build.
COPY . .
RUN pnpm -F web build

ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=production
EXPOSE 3000

# Persisted config + route/TLE caches live here; mount a volume to keep them.
VOLUME ["/app/server/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["pnpm", "start"]
