# CheeTaxi Dispatcher Console — Production image
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web-dispatcher/package.json ./apps/web-dispatcher/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web-dispatcher/node_modules ./apps/web-dispatcher/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @cheetaxi/web-dispatcher build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup --system --gid 1001 cheetaxi && \
    adduser --system --uid 1001 cheetaxi
COPY --from=builder /app/apps/web-dispatcher/.next/standalone ./
COPY --from=builder /app/apps/web-dispatcher/.next/static ./apps/web-dispatcher/.next/static
COPY --from=builder /app/apps/web-dispatcher/public ./apps/web-dispatcher/public
USER cheetaxi
EXPOSE 3002
CMD ["node", "apps/web-dispatcher/server.js"]
