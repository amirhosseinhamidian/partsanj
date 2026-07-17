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


FROM deps AS builder

COPY . .

ARG PARTSANJ_API_URL=https://api.partsanj.ir
ARG PARTSANJ_AUTH_REQUEST_OTP_PATH=/api/v1/auth/otp/request
ARG PARTSANJ_AUTH_VERIFY_OTP_PATH=/api/v1/auth/otp/verify
ARG PARTSANJ_AUTH_ME_PATH=/api/v1/auth/me
ARG NEXT_PUBLIC_SITE_URL=https://partsanj.ir
ARG SITE_URL=https://partsanj.ir

ENV NODE_ENV=production
ENV PARTSANJ_API_URL=${PARTSANJ_API_URL}
ENV PARTSANJ_AUTH_REQUEST_OTP_PATH=${PARTSANJ_AUTH_REQUEST_OTP_PATH}
ENV PARTSANJ_AUTH_VERIFY_OTP_PATH=${PARTSANJ_AUTH_VERIFY_OTP_PATH}
ENV PARTSANJ_AUTH_ME_PATH=${PARTSANJ_AUTH_ME_PATH}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV SITE_URL=${SITE_URL}

RUN pnpm --filter @partsanj/web build

RUN pnpm \
    --filter @partsanj/web \
    --prod \
    deploy \
    --legacy \
    /prod/web


FROM node:${NODE_VERSION}-bookworm-slim AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

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

COPY --from=builder --chown=partsanj:partsanj /prod/web ./
COPY --from=builder --chown=partsanj:partsanj /app/apps/web/.next ./.next
COPY --from=builder --chown=partsanj:partsanj /app/apps/web/public ./public

USER partsanj

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
