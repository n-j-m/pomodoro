import type { getRoutinesWithSessions, getSessionsWithRoutines } from "#/data/dal";
import type { SessionCategory } from "#/data/schema";

export type AppMode = "pomodoro" | "routine";
export type PomodoroPhase = "focus" | "short_break" | "long_break";

export interface PomodoroConfig {
  label: string;
  category: SessionCategory;
  durationSeconds: number;
}

export interface ActiveBlockMeta {
  title: string;
  category: SessionCategory;
  durationSeconds: number;
}

export const POMODORO_PHASES: Record<PomodoroPhase, PomodoroConfig> = {
  focus: { label: "Focus", category: "focus", durationSeconds: 25 * 60 },
  short_break: {
    label: "Short Break",
    category: "break",
    durationSeconds: 5 * 60,
  },
  long_break: {
    label: "Long Break",
    category: "break",
    durationSeconds: 15 * 60,
  },
};

export type SessionWithRoutine = Awaited<ReturnType<typeof getSessionsWithRoutines>>[number];

export type RoutineWithSessions = Awaited<ReturnType<typeof getRoutinesWithSessions>>[number];

export function formatDurationClock(totalMs: number): string {
  const clampedMs = Math.max(0, totalMs);
  const totalSeconds = Math.ceil(clampedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatCategoryBadge(category: SessionCategory): string {
  switch (category) {
    case "focus":
      return "Focus";
    case "break":
      return "Break";
    case "sit":
      return "Sit";
    case "stand":
      return "Stand";
    case "move":
      return "Move";
  }
}
