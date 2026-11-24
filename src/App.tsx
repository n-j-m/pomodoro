import { ModeSwitcher } from "#/components/ModeSwitcher";
import { PomodoroControls } from "#/components/PomodoroControls";
import { RoutineControls } from "#/components/RoutineControls";
import { SessionHistoryList } from "#/components/SessionHistoryList";
import { TimerDisplay } from "#/components/TimerDisplay";
import { db, initDb } from "#/data/client";
import { sessions, type SessionCategory, type SessionRoutine } from "#/data/schema";
import { useDriftFreeTimer } from "#/hooks/use-drift-free-timer";
import {
  type AppMode,
  POMODORO_PHASES,
  type PomodoroPhase,
  type RoutineWithSessions,
  type SessionWithRoutine,
  type ActiveBlockMeta,
} from "#/types/timer";
import { useCallback, useEffect, useMemo, useState } from "react";

function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>("pomodoro");

  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("focus");
  const [taskName, setTaskName] = useState("Deep work block");

  const [routines, setRoutines] = useState<RoutineWithSessions[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoAdvanceRoutine, setAutoAdvanceRoutine] = useState(true);

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
      category: "site" as SessionCategory,
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
    setSelectedRoutineId((prev) => prev ?? routineRows[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void initDb().then(async () => {
      await refreshData();
      setIsDbReady(true);
    });
  }, [refreshData]);

  const { isRunning, remainingMs, togglePlayPause, reset, setDurationSeconds } = useDriftFreeTimer({
    initialSeconds: currentBlockMeta.durationSeconds,
    onComplete: () => handleTimerComplete(),
  });

  const handleTimerComplete = useCallback(async () => {
    if (appMode === "pomodoro") {
      const cfg = POMODORO_PHASES[pomodoroPhase];
      await db.insert(sessions).values({
        task: taskName.trim() || "Untitled Task",
        routineId: null,
        stepLabel: cfg.label,
        category: cfg.category,
        durationSeconds: cfg.durationSeconds,
      });
      await refreshData();
      setDurationSeconds(cfg.durationSeconds, false);
    }

    if (activeRoutine && activeRoutineStep) {
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
      const shouldContinue = hasSteps && (!wrappedCycle || activeRoutine.repeatIndefinitley);

      setStepIndex(nextIdx);
      await refreshData();

      const nextStep = hasSteps ? activeRoutine.steps[nextIdx] : undefined;
      if (nextStep && shouldContinue) {
        setDurationSeconds(nextStep.durationSeconds, autoAdvanceRoutine);
      } else {
        setDurationSeconds(currentBlockMeta.durationSeconds, false);
      }
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
  ]);

  // NOTE(nick): handleTimerComplete references setDurationSeconds; wire a ref so the
  //       callback never reads stale timer actions.
  const handleCompleteRef = useCallback(() => handleTimerComplete(), [handleTimerComplete]);
  void handleCompleteRef;

  const selectAppMode = (nextMode: AppMode) => {
    setAppMode(nextMode);
    if (nextMode === "pomodoro") {
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
        Loading data ...
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

        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 space-y-6">
          {appMode === "pomodoro" ? (
            <PomodoroControls
              phase={pomodoroPhase}
              taskName={taskName}
              onSelectPhase={selectPomodoroPhase}
              onTaskNameChange={setTaskName}
            />
          ) : (
            <RoutineControls
              routines={routines}
              activeRoutine={activeRoutine}
              stepIndex={stepIndex}
              autoAdvance={autoAdvanceRoutine}
              onSelectRouting={selectRoutine}
              onToggleAutoAdvance={setAutoAdvanceRoutine}
            />
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
      </div>
    </div>
  );
}

export default App;
