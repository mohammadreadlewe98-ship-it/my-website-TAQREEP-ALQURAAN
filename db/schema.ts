import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  optionA: varchar("option_a", { length: 500 }).notNull(),
  optionB: varchar("option_b", { length: 500 }).notNull(),
  optionC: varchar("option_c", { length: 500 }).notNull(),
  optionD: varchar("option_d", { length: 500 }).notNull(),
  correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

export const studentResults = pgTable("student_results", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  answersJson: text("answers_json").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").notNull(),
  wrongCount: integer("wrong_count").notNull(),
  timeSpent: integer("time_spent").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type StudentResult = typeof studentResults.$inferSelect;
export type InsertStudentResult = typeof studentResults.$inferInsert;

export const examStatus = pgTable("exam_status", {
  id: serial("id").primaryKey(),
  active: integer("active").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ExamStatus = typeof examStatus.$inferSelect;
export type InsertExamStatus = typeof examStatus.$inferInsert;