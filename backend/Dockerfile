# ── Stage 1: build ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm install --include=dev
COPY src/ ./src/
RUN npx tsc --project tsconfig.json

# ── Stage 2: runtime ────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN mkdir -p /data
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "dist/server.js"]
