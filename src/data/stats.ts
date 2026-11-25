import { db } from "#/data/client";
import { sessions, type SessionCategory } from "#/data/schema";
import { gte, sum } from "drizzle-orm";

export type StatsRange = "today" | "all";

export interface CategoryStatsSummary {
  focusMinutes: number;
  breakMinutes: number;
  sitMinutes: number;
  standMinutes: number;
  moveMinutes: number;
  totalPostureMinutes: number;
  totalTrackedMinutes: number;
}

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

const toMinutes = (secs: number) => Math.round(secs / 60);

export async function fetchSessionStats(range: StatsRange): Promise<CategoryStatsSummary> {
  const baseQuery = db
    .select({
      category: sessions.category,
      totalSeconds: sum(sessions.durationSeconds).mapWith(Number),
    })
    .from(sessions);

  const rows =
    range === "today"
      ? await baseQuery
          .where(gte(sessions.completedAt, getStartOfToday()))
          .groupBy(sessions.category)
      : await baseQuery.groupBy(sessions.category);

  const secondsByCategory: Record<SessionCategory, number> = {
    focus: 0,
    break: 0,
    sit: 0,
    stand: 0,
    move: 0,
  };

  console.log("rows:", rows);
  console.log("secondsByCategory:", secondsByCategory);

  for (const row of rows) {
    secondsByCategory[row.category] = Number(row.totalSeconds);
  }

  console.log("secondsByCategory:", secondsByCategory);

  const focusMinutes = toMinutes(secondsByCategory.focus);
  const breakMinutes = toMinutes(secondsByCategory.break);
  const sitMinutes = toMinutes(secondsByCategory.sit);
  const standMinutes = toMinutes(secondsByCategory.stand);
  const moveMinutes = toMinutes(secondsByCategory.move);

  const totalPostureMinutes = sitMinutes + standMinutes + moveMinutes;
  const totalTrackedMinutes = focusMinutes + breakMinutes + totalPostureMinutes;

  return {
    focusMinutes,
    breakMinutes,
    sitMinutes,
    standMinutes,
    moveMinutes,
    totalPostureMinutes,
    totalTrackedMinutes,
  };
}
