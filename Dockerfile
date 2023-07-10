# ------------- deps ----------------
FROM node:lts-alpine AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile --force

# ------------- builder ----------------
# Rebuild the source code only when needed
FROM node:lts-alpine AS builder
ENV NODE_ENV=production

WORKDIR /opt/app
COPY . .
# copy all modules from build_image
COPY --from=deps /opt/app/node_modules ./node_modules
RUN cat .env \
     && npm run build \
     && npm prune --omit dev --omit optional --force

# ------------- image ----------------
# Production image
FROM node:lts-alpine AS runner
WORKDIR /opt/app

USER root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /opt/app/node_modules ./node_modules
COPY --from=builder /opt/app/next.config.js ./
COPY --from=builder /opt/app/next-sitemap.config.js ./
COPY --from=builder --chown=nextjs:nodejs /opt/app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /opt/app/public ./public

EXPOSE 3000

USER nextjs

CMD /opt/app/node_modules/.bin/next start -p 3000