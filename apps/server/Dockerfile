FROM oven/bun:1.2.18 AS build

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile
RUN bun run build --filter=server

FROM oven/bun:1.2.18 AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app ./

EXPOSE 3000

CMD ["bun", "run", "--filter", "server", "start"]
