import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@isp-app/api/context";
import { appRouter } from "@isp-app/api/routers/index";
import { auth } from "@isp-app/auth";
import { env } from "@isp-app/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();
const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(logger());
app.use(
  "/*",
  cors({
    origin: corsOrigins,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get("/apiku", (c) => c.json({ message: "Hello" }));

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
