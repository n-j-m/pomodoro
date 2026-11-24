import { PGlite } from "@electric-sql/pglite";
import { relations } from "#/data/relations";
import { drizzle } from "drizzle-orm/pglite";
import { sessionRoutines, type RoutineStep } from "#/data/schema";
import { runBrowserMigrations } from "#/data/migrate";
import { count } from "drizzle-orm";

const client = new PGlite("idb://pomodoro-db");
export const db = drizzle({ client, relations });

const TWENTY_EIGHT_TWO_STEPS: RoutineStep[] = [
  { label: "Sit", category: "sit", durationSeconds: 20 * 60 },
  { label: "Stand", category: "stand", durationSeconds: 8 * 60 },
  { label: "Move", category: "move", durationSeconds: 2 * 60 },
];

let initPromise: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await runBrowserMigrations(client);

      const [{ value: routineCount }] = await db.select({ value: count() }).from(sessionRoutines);

      if (routineCount === 0) {
        await db.insert(sessionRoutines).values({
          name: "20-8-2 Sit / Stand / Move",
          steps: TWENTY_EIGHT_TWO_STEPS,
          repeatIndefinitley: true,
          autoAdvance: false,
        });
      }
    })();
  }

  return initPromise;
}
