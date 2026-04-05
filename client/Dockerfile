# STAGE 1: The Build Factory
FROM node:20-alpine AS builder
WORKDIR /app

# Pass build-time variables (Render will provide these)
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_BACKEND_WEBSOCKET_URL

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_WEBSOCKET_URL=$NEXT_PUBLIC_BACKEND_WEBSOCKET_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Optimization: This tells Next to build a "standalone" folder
ENV NEXT_PRIVATE_STANDALONE_BUILD=true
RUN npm run build

# STAGE 2: The Lean Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# --- ADD THIS LINE ---
ENV PORT=3001

# We don't copy node_modules anymore! Standalone includes everything.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Render sets the $PORT variable automatically.
# Using 3001 locally is fine, but on Render, we use their assigned port.
EXPOSE 3001
CMD ["node", "server.js"]
