import type { SessionRoutine } from "#/data/schema";
import type { ActiveBlockMeta, AppMode, PomodoroPhase } from "#/types/timer";
import { createContext, useContext } from "react";

export interface TimerClockContextValue {
  appMode: AppMode;
  pomodoroPhase: PomodoroPhase;
  taskName: string;
  currentBlockMeta: ActiveBlockMeta;
  isRunning: boolean;
  remainingMs: number;
  selectPomodoroPhase: (phase: PomodoroPhase) => void;
  setTaskName: (name: string) => void;
  togglePlayPause: () => void;
  reset: () => void;
  syncRoutineSelection: (routine: SessionRoutine) => void;
  syncAfterRoutineSave: (saved: SessionRoutine | undefined) => void;
  syncAfterRoutineDelete: (nextRoutine: SessionRoutine | undefined) => void;
  syncStepSkip: () => void;
  syncAfterClearData: (firstRoutine: SessionRoutine | undefined) => void;
}

export const TimerClockContext = createContext<TimerClockContextValue | null>(null);

export function useTimerClock(): TimerClockContextValue {
  const ctx = useContext(TimerClockContext);
  if (!ctx) {
    throw new Error("useTimerClock must be used within a TimerClockProvider.");
  }

  return ctx;
}
