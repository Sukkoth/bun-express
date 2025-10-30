# Stage 1 — Build
FROM oven/bun:1 AS builder

WORKDIR /app

COPY bun.lock package.json ./

RUN bun install --frozen-lockfile

COPY . .

# Lint and build
RUN bun lint
RUN bun run build


# Stage 2 — Runtime
FROM oven/bun:1 AS runner

WORKDIR /app

# Copy built files and only production dependencies
COPY --from=builder /app ./

# Start the app
CMD ["bun", "start"]
