import { db, initDb, resetDbToInitialSeed } from "#/data/client";
import {
  sessionRoutines,
  sessions,
  type RoutineStep,
  type SessionCategory,
  type SessionRoutine,
} from "#/data/schema";
import {
  type SessionsAndRoutinesContextValue,
  type RecordPomodoroInput,
  type RecordRoutineStepResult,
  type SaveRoutineInput,
  SessionsAndRoutinesContext,
} from "#/hooks/use-sessions-and-routines";
import type { ActiveBlockMeta, RoutineWithSessions, SessionWithRoutine } from "#/types/timer";
import { eq } from "drizzle-orm";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export function SessionsAndRoutinesProvider({ children }: { children: ReactNode }) {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dataRevision, setDataRevision] = useState(0);

  const [routines, setRoutines] = useState<RoutineWithSessions[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoAdvanceRoutine, setAutoAdvanceRoutine] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<SessionRoutine | null>(null);

  const [recentSessions, setRecentSessions] = useState<SessionWithRoutine[]>([]);

  const activeRoutine = useMemo(
    () => routines.find((r) => r.id === selectedRoutineId) ?? routines[0],
    [routines, selectedRoutineId],
  );

  const activeRoutineStep = useMemo(() => {
    if (!activeRoutine || activeRoutine.steps.length === 0) return undefined;
    return activeRoutine.steps[stepIndex % activeRoutine.steps.length];
  }, [activeRoutine, stepIndex]);

  const refreshData = useCallback(async () => {
    const [routineRows, sessionRows] = await Promise.all([
      db.query.sessionRoutines.findMany({
        orderBy: { id: "asc" },
        with: {
          sessions: {
            orderBy: { completedAt: "desc" },
          },
        },
      }),
      db.query.sessions.findMany({
        limit: 15,
        orderBy: { completedAt: "desc" },
        with: {
          routine: true,
        },
      }),
    ]);

    setRoutines(routineRows);
    setRecentSessions(sessionRows);
    setSelectedRoutineId((prev) => {
      if (prev !== null && routineRows.some((r) => r.id === prev)) {
        return prev;
      }
      return routineRows[0]?.id ?? null;
    });
    setDataRevision((x) => x + 1);
  }, []);

  useEffect(() => {
    void initDb().then(async () => {
      await refreshData();
      setIsDbReady(true);
    });
  }, [refreshData]);

  const openCreateForm = useCallback(() => {
    setEditingRoutine(null);
    setIsFormOpen(true);
  }, []);

  const openEditForm = useCallback((routine: SessionRoutine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setEditingRoutine(null);
    setIsFormOpen(false);
  }, []);

  const selectRoutine = useCallback((routine: SessionRoutine) => {
    setSelectedRoutineId(routine.id);
    setStepIndex(0);
    setAutoAdvanceRoutine(routine.autoAdvance);
    setEditingRoutine(null);
    setIsFormOpen(false);
  }, []);

  const saveRoutine = useCallback(
    async (input: SaveRoutineInput): Promise<SessionRoutine | undefined> => {
      let savedId: number | undefined;

      if (input.id !== undefined) {
        await db
          .update(sessionRoutines)
          .set({
            name: input.name,
            steps: input.steps,
            repeatIndefinitely: input.repeatIndefinitiely,
            autoAdvance: input.autoAdvance,
          })
          .where(eq(sessionRoutines.id, input.id));

        savedId = input.id;
      } else {
        const [inserted] = await db
          .insert(sessionRoutines)
          .values({
            name: input.name,
            steps: input.steps,
            repeatIndefinitely: input.repeatIndefinitiely,
            autoAdvance: input.autoAdvance,
          })
          .returning({ id: sessionRoutines.id });

        savedId = inserted?.id;
      }

      await refreshData();

      if (savedId === undefined) return undefined;

      const saved = await db.query.sessionRoutines.findFirst({
        where: { id: savedId },
      });

      setSelectedRoutineId(savedId);
      setStepIndex(0);
      setEditingRoutine(null);
      setIsFormOpen(false);
      setAutoAdvanceRoutine(saved?.autoAdvance ?? input.autoAdvance);

      return saved;
    },
    [refreshData],
  );

  const deleteRoutine = useCallback(
    async (routineId: number): Promise<SessionRoutine | undefined> => {
      await db.delete(sessionRoutines).where(eq(sessionRoutines.id, routineId));

      if (editingRoutine?.id === routineId) {
        setEditingRoutine(null);
        setIsFormOpen(false);
      }

      const remaining = await db.query.sessionRoutines.findMany({
        orderBy: { id: "asc" },
      });

      const nextSelected =
        selectedRoutineId === routineId ? (remaining[0]?.id ?? null) : selectedRoutineId;

      setSelectedRoutineId(nextSelected);
      setStepIndex(0);
      await refreshData();

      return remaining.find((r) => r.id === nextSelected);
    },
    [editingRoutine, selectedRoutineId, refreshData],
  );

  const advanceRoutineStepManually = useCallback((): RoutineStep | undefined => {
    if (!activeRoutine || activeRoutine.steps.length === 0) return undefined;
    const nextIdx = (stepIndex + 1) % activeRoutine.steps.length;
    setStepIndex(nextIdx);
    return activeRoutine.steps[nextIdx];
  }, [activeRoutine, stepIndex]);

  const recordPomodoroSession = useCallback(
    async ({ taskName, block }: RecordPomodoroInput): Promise<void> => {
      await db.insert(sessions).values({
        task: taskName.trim() || "Untitled Task",
        routineId: null,
        stepLabel: block.title,
        category: block.category,
        durationSeconds: block.durationSeconds,
      });
      await refreshData();
    },
    [refreshData],
  );

  const recordRoutineStepCompletion =
    useCallback(async (): Promise<RecordRoutineStepResult | null> => {
      if (!activeRoutine || !activeRoutineStep) return null;

      const completedBlock: ActiveBlockMeta = {
        title: activeRoutineStep.label,
        category: activeRoutineStep.category as SessionCategory,
        durationSeconds: activeRoutineStep.durationSeconds,
      };

      await db.insert(sessions).values({
        task: null,
        routineId: activeRoutine.id,
        stepLabel: activeRoutineStep.label,
        category: activeRoutineStep.category,
        durationSeconds: activeRoutineStep.durationSeconds,
      });

      const hasSteps = activeRoutine.steps.length > 0;
      const nextIdx = hasSteps ? (stepIndex + 1) % activeRoutine.steps.length : 0;

      const wrappedCycle = hasSteps && nextIdx === 0;
      const shouldContinue = hasSteps && (!wrappedCycle || activeRoutine.repeatIndefinitely);

      setStepIndex(nextIdx);
      await refreshData();

      const nextStep = hasSteps ? activeRoutine.steps[nextIdx] : undefined;
      const nextBlock: ActiveBlockMeta | undefined =
        nextStep && shouldContinue
          ? {
              title: nextStep.label,
              category: nextStep.category as SessionCategory,
              durationSeconds: nextStep.durationSeconds,
            }
          : undefined;

      return {
        completedBlock,
        routineName: activeRoutine.name,
        nextBlock,
        willAutoAdvance: Boolean(nextBlock && autoAdvanceRoutine),
      };
    }, [activeRoutine, activeRoutineStep, stepIndex, autoAdvanceRoutine, refreshData]);

  const clearAllData = useCallback(async (): Promise<SessionRoutine | undefined> => {
    await resetDbToInitialSeed();
    await refreshData();

    const seededRoutines = await db.query.sessionRoutines.findMany({
      orderBy: { id: "asc" },
    });

    const firstRoutine = seededRoutines[0];
    setSelectedRoutineId(firstRoutine?.id ?? null);
    setStepIndex(0);
    setAutoAdvanceRoutine(firstRoutine?.autoAdvance ?? false);
    setEditingRoutine(null);
    setIsFormOpen(false);

    return firstRoutine;
  }, [refreshData]);

  const value = useMemo<SessionsAndRoutinesContextValue>(
    () => ({
      isDbReady,
      dataRevision,
      routines,
      activeRoutine,
      activeRoutineStep,
      stepIndex,
      autoAdvanceRoutine,
      isFormOpen,
      editingRoutine,
      recentSessions,
      openCreateForm,
      openEditForm,
      closeForm,
      selectRoutine,
      saveRoutine,
      deleteRoutine,
      setAutoAdvanceRoutine,
      advanceRoutineStepManually,
      recordPomodoroSession,
      recordRoutineStepCompletion,
      refreshData,
      clearAllData,
    }),
    [
      isDbReady,
      dataRevision,
      routines,
      activeRoutine,
      activeRoutineStep,
      stepIndex,
      autoAdvanceRoutine,
      isFormOpen,
      editingRoutine,
      recentSessions,
      openCreateForm,
      openEditForm,
      closeForm,
      selectRoutine,
      saveRoutine,
      deleteRoutine,
      setAutoAdvanceRoutine,
      advanceRoutineStepManually,
      recordPomodoroSession,
      recordRoutineStepCompletion,
      refreshData,
      clearAllData,
    ],
  );

  return (
    <SessionsAndRoutinesContext.Provider value={value}>
      {children}
    </SessionsAndRoutinesContext.Provider>
  );
}
