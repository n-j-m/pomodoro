import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type SessionCategory = "focus" | "break" | "sit" | "stand" | "move";

export interface RoutineStep {
  label: string;
  category: SessionCategory;
  durationSeconds: number;
}

export const sessionRoutines = pgTable("session_routines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  steps: jsonb("steps").$type<RoutineStep[]>().notNull(),
  repeatIndefinitely: boolean("repeat_indefinitely").notNull().default(true),
  autoAdvance: boolean("auto_advance").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  task: text("task"),
  routineId: integer("routine_id").references(() => sessionRoutines.id, { onDelete: "set null" }),
  stepLabel: text("step_label").notNull(),
  category: text("category", {
    enum: ["focus", "break", "sit", "stand", "move"],
  }).notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export type SessionRoutine = typeof sessionRoutines.$inferSelect;
export type NewSessionRouting = typeof sessionRoutines.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
