import { createRouter, publicQuery } from "./middleware";
import { questionsRouter, resultsRouter, examRouter } from "./examRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  question: questionsRouter,
  result: resultsRouter,
  exam: examRouter,
});

export type AppRouter = typeof appRouter;
