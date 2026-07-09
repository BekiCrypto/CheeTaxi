# CheeTaxi Landing — Production image
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web-landing/package.json ./apps/web-landing/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web-landing/node_modules ./apps/web-landing/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @cheetaxi/shared build
RUN pnpm --filter @cheetaxi/web-landing build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup --system --gid 1001 cheetaxi && \
    adduser --system --uid 1001 cheetaxi
COPY --from=builder /app/apps/web-landing/.next/standalone ./
COPY --from=builder /app/apps/web-landing/.next/static ./apps/web-landing/.next/static
COPY --from=builder /app/apps/web-landing/public ./apps/web-landing/public
USER cheetaxi
EXPOSE 3000
CMD ["node", "apps/web-landing/server.js"]
