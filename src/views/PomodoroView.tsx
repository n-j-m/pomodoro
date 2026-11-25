import { PomodoroControls } from "#/components/PomodoroControls";
import { TimerDisplay } from "#/components/TimerDisplay";
import { useTimerClock } from "#/hooks/use-timer-clock";

export function PomodoroView() {
  const {
    pomodoroPhase,
    taskName,
    currentBlockMeta,
    remainingMs,
    isRunning,
    selectPomodoroPhase,
    setTaskName,
    togglePlayPause,
    reset,
  } = useTimerClock();

  return (
    <div className="space-y-6">
      <PomodoroControls
        phase={pomodoroPhase}
        taskName={taskName}
        onSelectPhase={selectPomodoroPhase}
        onTaskNameChange={setTaskName}
      />

      <TimerDisplay
        appMode="pomodoro"
        blockMeta={currentBlockMeta}
        remainingMs={remainingMs}
        isRunning={isRunning}
        onTogglePlayPause={togglePlayPause}
        onReset={reset}
      />
    </div>
  );
}
