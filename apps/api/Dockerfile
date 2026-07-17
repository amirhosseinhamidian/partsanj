# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24
ARG PNPM_VERSION=11.9.0

FROM node:${NODE_VERSION}-bookworm-slim AS base

ARG PNPM_VERSION

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

WORKDIR /app

RUN corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate


FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN --mount=type=cache,id=partsanj-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


FROM deps AS source

COPY . .

ARG DATABASE_URL=postgresql://partsanj:build-only@127.0.0.1:5432/partsanj?schema=public
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm db:generate


FROM source AS builder

RUN pnpm --filter @partsanj/api build

RUN pnpm \
    --filter @partsanj/api \
    --prod \
    deploy \
    --legacy \
    /prod/api


FROM source AS migrate

ENV NODE_ENV=production

ENTRYPOINT ["pnpm", "exec", "prisma"]
CMD ["migrate", "deploy"]


FROM node:${NODE_VERSION}-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 partsanj \
    && useradd \
        --system \
        --uid 1001 \
        --gid partsanj \
        --home-dir /app \
        --shell /usr/sbin/nologin \
        partsanj

COPY --from=builder --chown=partsanj:partsanj /prod/api ./
COPY --from=builder --chown=partsanj:partsanj /app/apps/api/dist ./dist

USER partsanj

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
