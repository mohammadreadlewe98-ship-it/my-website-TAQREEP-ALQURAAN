import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { questions, studentResults, examStatus } from "@db/schema";
import { eq } from "drizzle-orm";

export const questionsRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.query.questions.findMany({
      orderBy: (questions, { asc }) => [asc(questions.id)],
    });
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.query.questions.findFirst({
        where: eq(questions.id, input.id),
      });
      return result ?? null;
    }),

  create: publicQuery
    .input(z.object({
      text: z.string().min(1),
      optionA: z.string().min(1),
      optionB: z.string().min(1),
      optionC: z.string().min(1),
      optionD: z.string().min(1),
      correctAnswer: z.enum(["A", "B", "C", "D"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(questions).values(input).$returningId();
      return result;
    }),

  update: publicQuery
    .input(z.object({
      id: z.number(),
      text: z.string().min(1),
      optionA: z.string().min(1),
      optionB: z.string().min(1),
      optionC: z.string().min(1),
      optionD: z.string().min(1),
      correctAnswer: z.enum(["A", "B", "C", "D"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(questions).set(data).where(eq(questions.id, id));
      return { id };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(questions).where(eq(questions.id, input.id));
      return { id: input.id };
    }),
});

export const resultsRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.query.studentResults.findMany({
      orderBy: (studentResults, { desc }) => [desc(studentResults.createdAt)],
    });
  }),

  create: publicQuery
    .input(z.object({
      name: z.string().min(1),
      answersJson: z.string(),
      score: z.number().min(0).max(100),
      totalQuestions: z.number(),
      correctCount: z.number(),
      wrongCount: z.number(),
      timeSpent: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(studentResults).values(input).$returningId();
      return result;
    }),
});

export const examRouter = createRouter({
  status: publicQuery.query(async () => {
    const db = getDb();
    const status = await db.query.examStatus.findFirst();
    if (!status) {
      await db.insert(examStatus).values({ active: 1 });
      return { active: true };
    }
    return { active: status.active === 1 };
  }),

  updateStatus: publicQuery
    .input(z.object({ active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.query.examStatus.findFirst();
      if (existing) {
        await db.update(examStatus)
          .set({ active: input.active ? 1 : 0, updatedAt: new Date() })
          .where(eq(examStatus.id, existing.id));
      } else {
        await db.insert(examStatus).values({ active: input.active ? 1 : 0 });
      }
      return { active: input.active };
    }),
});
