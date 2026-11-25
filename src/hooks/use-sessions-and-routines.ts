import type { RoutineStep, SessionRoutine } from "#/data/schema";
import type { ActiveBlockMeta, RoutineWithSessions, SessionWithRoutine } from "#/types/timer";
import { createContext, useContext } from "react";

export interface SaveRoutineInput {
  id?: number;
  name: string;
  steps: RoutineStep[];
  repeatIndefinitiely: boolean;
  autoAdvance: boolean;
}

export interface RecordPomodoroInput {
  taskName: string;
  block: ActiveBlockMeta;
}

export interface RecordRoutineStepResult {
  completedBlock: ActiveBlockMeta;
  routineName: string;
  nextBlock?: ActiveBlockMeta;
  willAutoAdvance: boolean;
}

export interface SessionsAndRoutinesContextValue {
  isDbReady: boolean;
  dataRevision: number;
  routines: RoutineWithSessions[];
  activeRoutine: RoutineWithSessions | undefined;
  activeRoutineStep: RoutineStep | undefined;
  stepIndex: number;
  autoAdvanceRoutine: boolean;
  isFormOpen: boolean;
  editingRoutine: SessionRoutine | null;
  recentSessions: SessionWithRoutine[];
  openCreateForm: () => void;
  openEditForm: (routine: SessionRoutine) => void;
  closeForm: () => void;
  selectRoutine: (routine: SessionRoutine) => void;
  saveRoutine: (input: SaveRoutineInput) => Promise<SessionRoutine | undefined>;
  deleteRoutine: (routineId: number) => Promise<SessionRoutine | undefined>;
  setAutoAdvanceRoutine: (checked: boolean) => void;
  advanceRoutineStepManually: () => RoutineStep | undefined;
  recordPomodoroSession: (input: RecordPomodoroInput) => Promise<void>;
  recordRoutineStepCompletion: () => Promise<RecordRoutineStepResult | null>;
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<SessionRoutine | undefined>;
}

export const SessionsAndRoutinesContext = createContext<SessionsAndRoutinesContextValue | null>(
  null,
);

export function useSessionsAndRoutines(): SessionsAndRoutinesContextValue {
  const ctx = useContext(SessionsAndRoutinesContext);
  if (!ctx) {
    throw new Error("useSessionsAndRoutines must be used within a SessionsAndRoutinesProvider.");
  }

  return ctx;
}
