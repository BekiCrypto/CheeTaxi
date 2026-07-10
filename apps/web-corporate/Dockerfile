# CheeTaxi Corporate Portal — Production image
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web-corporate/package.json ./apps/web-corporate/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web-corporate/node_modules ./apps/web-corporate/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @cheetaxi/web-corporate build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup --system --gid 1001 cheetaxi && adduser --system --uid 1001 cheetaxi
COPY --from=builder /app/apps/web-corporate/.next/standalone ./
COPY --from=builder /app/apps/web-corporate/.next/static ./apps/web-corporate/.next/static
COPY --from=builder /app/apps/web-corporate/public ./apps/web-corporate/public
USER cheetaxi
EXPOSE 3003
CMD ["node", "apps/web-corporate/server.js"]
