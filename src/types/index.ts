import { Hono } from "hono";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";

export const config = {
  runtime: "edge",
};

const app = new Hono();

app.use("/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/*", (c) => c.json({ error: "Not Found" }, 404));

export default app.fetch.bind(app);