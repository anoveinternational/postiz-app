# Build from the repository root: docker build -f anove/Dockerfile .
FROM ghcr.io/gitroomhq/postiz-app:v2.24.0@sha256:01b24a4fc1055f6833122c99614805bea702fdc0ee30c9b5d09330b521fa1efa
COPY anove/narrow-youtube-scopes.cjs /tmp/narrow-youtube-scopes.cjs
RUN node /tmp/narrow-youtube-scopes.cjs && rm /tmp/narrow-youtube-scopes.cjs
COPY apps/backend/src /app/apps/backend/src
COPY libraries /app/libraries
RUN cd /app && NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter ./apps/backend run build
COPY apps/frontend/src /app/apps/frontend/src
COPY apps/frontend/public/anove /app/apps/frontend/public/anove
COPY anove /app/anove
COPY LICENSE /app/LICENSE
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd /app/apps/frontend && NODE_OPTIONS=--max-old-space-size=4096 pnpm exec next build
RUN tar --exclude=node_modules --exclude=.next --exclude=dist --exclude='.env*' \
        --exclude=node-compile-cache --exclude=source.tar.gz \
        -czf /tmp/anove-source.tar.gz -C /app apps libraries var anove LICENSE \
        package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json && \
    mv /tmp/anove-source.tar.gz /app/apps/frontend/public/anove/source.tar.gz
