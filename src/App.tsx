import { ChimeToggle } from "#/components/ChimeToggle";
import { ClearDataButton } from "#/components/ClearDataButton";
import { NotificationBanner } from "#/components/NotificationBanner";
import { db, initDb, resetDbToInitialSeed } from "#/data/client";
import {
  sessionRoutines,
  sessions,
  type SessionCategory,
  type SessionRoutine,
} from "#/data/schema";
import { useDriftFreeTimer } from "#/hooks/use-drift-free-timer";
import { useIntervalChime } from "#/hooks/use-interval-chime";
import { useIntervalNotifications } from "#/hooks/use-interval-notifications";
import { eq } from "drizzle-orm";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ModeSwitcher } from "./components/ModeSwitcher";
import { PomodoroControls } from "./components/PomodoroControls";
import { RoutineControls } from "./components/RoutineControls";
import { RoutineCreatorForm } from "./components/RoutineCreatorForm";
import { SessionHistoryList } from "./components/SessionHistoryList";
import { TimerDisplay } from "./components/TimerDisplay";
import {
  POMODORO_PHASES,
  type ActiveBlockMeta,
  type AppMode,
  type PomodoroPhase,
  type RoutineWithSessions,
  type SessionWithRoutine,
} from "./types/timer";

export function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>("pomodoro");

  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("focus");
  const [taskName, setTaskName] = useState("Deep work block");

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

  const currentBlockMeta: ActiveBlockMeta = useMemo(() => {
    if (appMode === "pomodoro") {
      const cfg = POMODORO_PHASES[pomodoroPhase];
      return {
        title: cfg.label,
        category: cfg.category,
        durationSeconds: cfg.durationSeconds,
      };
    }

    if (activeRoutineStep) {
      return {
        title: activeRoutineStep.label,
        category: activeRoutineStep.category,
        durationSeconds: activeRoutineStep.durationSeconds,
      };
    }

    return {
      title: "Sit",
      category: "sit" as SessionCategory,
      durationSeconds: 20 * 60,
    };
  }, [appMode, pomodoroPhase, activeRoutineStep]);

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
  }, []);

  useEffect(() => {
    void initDb().then(async () => {
      await refreshData();
      setIsDbReady(true);
    });
  }, [refreshData]);

  const {
    permission: notificationPermission,
    enabled: notificationsEnabled,
    requestPermission: requestNotificationPermission,
    toggleEnabled: toggleNotificationsEnabled,
    notifyIntervalComplete,
  } = useIntervalNotifications();

  const { chimeEnabled, toggleChime, playChime } = useIntervalChime();

  const { isRunning, remainingMs, togglePlayPause, reset, setDurationSeconds } = useDriftFreeTimer({
    initialSeconds: currentBlockMeta.durationSeconds,
    onComplete: () => handleTimerComplete(),
  });

  const handleTimerComplete = useCallback(async () => {
    if (appMode === "pomodoro") {
      const cfg = POMODORO_PHASES[pomodoroPhase];
      const completedBlock: ActiveBlockMeta = {
        title: cfg.label,
        category: cfg.category,
        durationSeconds: cfg.durationSeconds,
      };

      await db.insert(sessions).values({
        task: taskName.trim() || "Untitled Task",
        routineId: null,
        stepLabel: cfg.label,
        category: cfg.category,
        durationSeconds: cfg.durationSeconds,
      });
      await refreshData();
      setDurationSeconds(cfg.durationSeconds, false);

      notifyIntervalComplete({
        appMode: "pomodoro",
        completedBlock,
        taskName,
        nextBlock: completedBlock,
        willAutoAdvance: false,
      });
      playChime("pomodoro");
      return;
    }

    if (activeRoutine && activeRoutineStep) {
      const completedBlock: ActiveBlockMeta = {
        title: activeRoutineStep.label,
        category: activeRoutineStep.category,
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
              category: nextStep.category,
              durationSeconds: nextStep.durationSeconds,
            }
          : undefined;

      if (nextBlock) {
        setDurationSeconds(nextBlock.durationSeconds, autoAdvanceRoutine);
      } else {
        setDurationSeconds(currentBlockMeta.durationSeconds, false);
      }

      notifyIntervalComplete({
        appMode: "routine",
        completedBlock,
        taskName,
        routineName: activeRoutine.name,
        nextBlock,
        willAutoAdvance: Boolean(nextBlock && autoAdvanceRoutine),
      });
      playChime("routine");
    }
  }, [
    appMode,
    pomodoroPhase,
    taskName,
    refreshData,
    activeRoutine,
    activeRoutineStep,
    stepIndex,
    autoAdvanceRoutine,
    currentBlockMeta.durationSeconds,
    setDurationSeconds,
    notifyIntervalComplete,
    playChime,
  ]);

  const handleRoutineSaved = useCallback(
    async (savedRoutineId: number) => {
      await refreshData();

      const saved = await db.query.sessionRoutines.findFirst({
        where: { id: savedRoutineId },
      });

      setSelectedRoutineId(savedRoutineId);
      setStepIndex(0);
      setEditingRoutine(null);
      setIsFormOpen(false);
      setAutoAdvanceRoutine(saved?.autoAdvance ?? true);

      const firstStep = saved?.steps[0];
      if (firstStep) {
        setDurationSeconds(firstStep.durationSeconds, false);
      }
    },
    [refreshData, setDurationSeconds],
  );

  const handleDeleteRoutine = useCallback(
    async (routineId: number) => {
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

      const nextRoutine = remaining.find((r) => r.id === nextSelected);
      const nextStep = nextRoutine?.steps[0];
      if (nextStep) {
        setDurationSeconds(nextStep.durationSeconds, false);
      } else {
        setDurationSeconds(20 * 60, false);
      }
    },
    [editingRoutine, selectedRoutineId, refreshData, setDurationSeconds],
  );

  const openCreateForm = () => {
    setEditingRoutine(null);
    setIsFormOpen(true);
  };

  const openEditForm = (routine: SessionRoutine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingRoutine(null);
    setIsFormOpen(false);
  };

  const handleClearData = useCallback(async () => {
    await resetDbToInitialSeed();
    await refreshData();

    const seededRoutines = await db.query.sessionRoutines.findMany({
      orderBy: { id: "asc" },
    });

    const firstRoutine = seededRoutines[0];
    setSelectedRoutineId(firstRoutine?.id ?? null);
    setStepIndex(0);
    setAutoAdvanceRoutine(firstRoutine?.autoAdvance ?? false);
    closeForm();

    if (appMode === "routine" && firstRoutine?.steps[0]) {
      setDurationSeconds(firstRoutine.steps[0].durationSeconds, false);
    } else {
      setDurationSeconds(POMODORO_PHASES[pomodoroPhase].durationSeconds, false);
    }
  }, [appMode, pomodoroPhase, refreshData, setDurationSeconds]);
  const selectAppMode = (nextMode: AppMode) => {
    setAppMode(nextMode);
    if (nextMode === "pomodoro") {
      closeForm();
      setDurationSeconds(POMODORO_PHASES[pomodoroPhase].durationSeconds, false);
    } else if (activeRoutineStep) {
      setDurationSeconds(activeRoutineStep.durationSeconds, false);
    }
  };

  const selectPomodoroPhase = (nextPhase: PomodoroPhase) => {
    setPomodoroPhase(nextPhase);
    setDurationSeconds(POMODORO_PHASES[nextPhase].durationSeconds, false);
  };

  const selectRoutine = (routine: SessionRoutine) => {
    setSelectedRoutineId(routine.id);
    setStepIndex(0);
    setAutoAdvanceRoutine(routine.autoAdvance);
    closeForm();
    const firstStep = routine.steps[0];
    if (firstStep) {
      setDurationSeconds(firstStep.durationSeconds, false);
    }
  };

  const advanceRoutineStepManually = () => {
    if (!activeRoutine || activeRoutine.steps.length === 0) return;
    const nextIdx = (stepIndex + 1) % activeRoutine.steps.length;
    setStepIndex(nextIdx);
    const nextStep = activeRoutine.steps[nextIdx];
    if (nextStep) {
      setDurationSeconds(nextStep.durationSeconds, false);
    }
  };

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-sm">
        Loading PGlite &amp; running Drizzle migrations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
      <div className="mx-auto max-w-xl space-y-6">
        <ModeSwitcher
          appMode={appMode}
          onSelectMode={selectAppMode}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <NotificationBanner
            permission={notificationPermission}
            enabled={notificationsEnabled}
            onRequestPermission={requestNotificationPermission}
            onToggleEnabled={toggleNotificationsEnabled}
          />
          <ChimeToggle
            enabled={chimeEnabled}
            onToggle={toggleChime}
          />
        </div>

        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
          {appMode === "pomodoro" ? (
            <PomodoroControls
              phase={pomodoroPhase}
              taskName={taskName}
              onSelectPhase={selectPomodoroPhase}
              onTaskNameChange={setTaskName}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Repeating Routine</span>
                <button
                  type="button"
                  onClick={() => (isFormOpen ? closeForm() : openCreateForm())}
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition"
                >
                  {isFormOpen ? "Close Form" : "+ New Routine"}
                </button>
              </div>

              {isFormOpen ? (
                <RoutineCreatorForm
                  routineToEdit={editingRoutine}
                  onSaved={handleRoutineSaved}
                  onCancel={closeForm}
                />
              ) : (
                <RoutineControls
                  routines={routines}
                  activeRoutine={activeRoutine}
                  stepIndex={stepIndex}
                  autoAdvance={autoAdvanceRoutine}
                  onSelectRoutine={selectRoutine}
                  onEditRoutine={openEditForm}
                  onDeleteRoutine={handleDeleteRoutine}
                  onToggleAutoAdvance={setAutoAdvanceRoutine}
                />
              )}
            </div>
          )}

          <TimerDisplay
            appMode={appMode}
            blockMeta={currentBlockMeta}
            remainingMs={remainingMs}
            isRunning={isRunning}
            onTogglePlayPause={togglePlayPause}
            onReset={reset}
            onSkipStep={appMode === "routine" ? advanceRoutineStepManually : undefined}
          />
        </section>

        <SessionHistoryList sessions={recentSessions} />
        <footer className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs text-zinc-500">
          <span>Stored locally in PGlite (IndexedDB)</span>
          <ClearDataButton onClearData={handleClearData} />
        </footer>
      </div>
    </div>
  );
}

export default App;
