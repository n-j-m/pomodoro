import type { SessionRoutine } from "#/data/schema";
import { useAlertPreferences } from "#/hooks/use-alert-preferences";
import { useDriftFreeTimer } from "#/hooks/use-drift-free-timer";
import { useSessionsAndRoutines } from "#/hooks/use-sessions-and-routines";
import { TimerClockContext, type TimerClockContextValue } from "#/hooks/use-timer-clock";
import {
  POMODORO_PHASES,
  type ActiveBlockMeta,
  type AppMode,
  type PomodoroPhase,
} from "#/types/timer";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";

export function TimerClockProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const appMode: AppMode = location === "/routine" ? "routine" : "pomodoro";

  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("focus");
  const [taskName, setTaskName] = useState("Deep work block");

  const {
    activeRoutine,
    activeRoutineStep,
    closeForm,
    recordPomodoroSession,
    recordRoutineStepCompletion,
  } = useSessionsAndRoutines();
  const { notifyCompletion } = useAlertPreferences();

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
      category: "sit",
      durationSeconds: 20 * 60,
    };
  }, [appMode, pomodoroPhase, activeRoutineStep]);

  const setDurationRef = useRef<(seconds: number, startImmediately: boolean) => void>(() => {});

  const handleTimerComplete = useCallback(async () => {
    if (appMode === "pomodoro") {
      const cfg = POMODORO_PHASES[pomodoroPhase];
      const completedBlock: ActiveBlockMeta = {
        title: cfg.label,
        category: cfg.category,
        durationSeconds: cfg.durationSeconds,
      };

      await recordPomodoroSession({ taskName, block: completedBlock });
      setDurationRef.current(cfg.durationSeconds, false);

      notifyCompletion({
        appMode: "pomodoro",
        completedBlock,
        taskName,
        nextBlock: completedBlock,
        willAutoAdvance: false,
      });
      return;
    }

    if (activeRoutine && activeRoutineStep) {
      const result = await recordRoutineStepCompletion();
      if (!result) return;

      if (result.nextBlock) {
        setDurationRef.current(result.nextBlock.durationSeconds, result.willAutoAdvance);
      } else {
        setDurationRef.current(currentBlockMeta.durationSeconds, false);
      }

      notifyCompletion({
        appMode: "routine",
        completedBlock: result.completedBlock,
        taskName,
        routineName: result.routineName,
        nextBlock: result.nextBlock,
        willAutoAdvance: result.willAutoAdvance,
      });
    }
  }, [
    appMode,
    pomodoroPhase,
    taskName,
    recordPomodoroSession,
    notifyCompletion,
    activeRoutine,
    activeRoutineStep,
    recordRoutineStepCompletion,
    currentBlockMeta.durationSeconds,
  ]);

  const { isRunning, remainingMs, togglePlayPause, reset, setDurationSeconds } = useDriftFreeTimer({
    initialSeconds: currentBlockMeta.durationSeconds,
    onComplete: handleTimerComplete,
  });

  useEffect(() => {
    setDurationRef.current = setDurationSeconds;
  }, [setDurationSeconds]);

  const prevModeRef = useRef<AppMode>(appMode);
  useEffect(() => {
    if (prevModeRef.current === appMode) return;
    prevModeRef.current = appMode;

    if (appMode === "pomodoro") {
      closeForm();
      setDurationSeconds(POMODORO_PHASES[pomodoroPhase].durationSeconds, false);
    } else if (activeRoutineStep) {
      setDurationSeconds(activeRoutineStep.durationSeconds, false);
    } else {
      setDurationSeconds(20 * 60, false);
    }
  }, [appMode, pomodoroPhase, activeRoutineStep, closeForm, setDurationSeconds]);

  const selectPomodoroPhase = useCallback(
    (nextPhase: PomodoroPhase) => {
      setPomodoroPhase(nextPhase);
      setDurationSeconds(POMODORO_PHASES[nextPhase].durationSeconds, false);
    },
    [setDurationSeconds],
  );

  const syncRoutineSelection = useCallback(
    (routine: SessionRoutine) => {
      const firstStep = routine.steps[0];
      if (firstStep) {
        setDurationSeconds(firstStep.durationSeconds, false);
      }
    },
    [setDurationSeconds],
  );

  const syncAfterRoutineSave = useCallback(
    (saved: SessionRoutine | undefined) => {
      const firstStep = saved?.steps[0];
      if (firstStep) {
        setDurationSeconds(firstStep.durationSeconds, false);
      }
    },
    [setDurationSeconds],
  );

  const syncAfterRoutineDelete = useCallback(
    (nextRoutine: SessionRoutine | undefined) => {
      const nextStep = nextRoutine?.steps[0];
      if (nextStep) {
        setDurationSeconds(nextStep.durationSeconds, false);
      } else {
        setDurationSeconds(20 * 60, false);
      }
    },
    [setDurationSeconds],
  );

  const setDurationForNextStep = useCallback(
    (nextStepDuration: number | undefined) => {
      if (nextStepDuration !== undefined) {
        setDurationSeconds(nextStepDuration, false);
      }
    },
    [setDurationSeconds],
  );

  const syncStepSkip = useCallback(() => {
    if (!activeRoutine || activeRoutine.steps.length === 0) return;
    const currentIdx = activeRoutineStep ? activeRoutine.steps.indexOf(activeRoutineStep) : 0;
    const nextIdx = ((currentIdx >= 0 ? currentIdx : 0) + 1) % activeRoutine.steps.length;
    setDurationForNextStep(activeRoutine.steps[nextIdx]?.durationSeconds);
  }, [activeRoutine, activeRoutineStep, setDurationForNextStep]);

  const syncAfterClearData = useCallback(
    (firstRoutine: SessionRoutine | undefined) => {
      if (appMode === "routine" && firstRoutine?.steps[0]) {
        setDurationSeconds(firstRoutine.steps[0].durationSeconds, false);
      } else {
        setDurationSeconds(POMODORO_PHASES[pomodoroPhase].durationSeconds, false);
      }
    },
    [appMode, pomodoroPhase, setDurationSeconds],
  );

  const value = useMemo<TimerClockContextValue>(
    () => ({
      appMode,
      pomodoroPhase,
      taskName,
      currentBlockMeta,
      isRunning,
      remainingMs,
      selectPomodoroPhase,
      setTaskName,
      togglePlayPause,
      reset,
      syncRoutineSelection,
      syncAfterRoutineSave,
      syncAfterRoutineDelete,
      syncStepSkip,
      syncAfterClearData,
    }),
    [
      appMode,
      pomodoroPhase,
      taskName,
      currentBlockMeta,
      isRunning,
      remainingMs,
      selectPomodoroPhase,
      togglePlayPause,
      reset,
      syncRoutineSelection,
      syncAfterRoutineSave,
      syncAfterRoutineDelete,
      syncStepSkip,
      syncAfterClearData,
    ],
  );

  return <TimerClockContext.Provider value={value}>{children}</TimerClockContext.Provider>;
}
