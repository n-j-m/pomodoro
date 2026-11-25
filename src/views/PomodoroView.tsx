import { PomodoroControls } from "#/components/PomodoroControls";
import { TimerDisplay } from "#/components/TimerDisplay";
import type { ActiveBlockMeta, PomodoroPhase } from "#/types/timer";

interface PomodoroViewProps {
  phase: PomodoroPhase;
  taskName: string;
  blockMeta: ActiveBlockMeta;
  remainingMs: number;
  isRunning: boolean;
  onSelectPhase: (phase: PomodoroPhase) => void;
  onTaskNameChange: (name: string) => void;
  onTogglePlayPause: () => void;
  onReset: () => void;
}

export function PomodoroView({
  phase,
  taskName,
  blockMeta,
  remainingMs,
  isRunning,
  onSelectPhase,
  onTaskNameChange,
  onTogglePlayPause,
  onReset,
}: PomodoroViewProps) {
  return (
    <div className="space-y-6">
      <PomodoroControls
        phase={phase}
        taskName={taskName}
        onSelectPhase={onSelectPhase}
        onTaskNameChange={onTaskNameChange}
      />

      <TimerDisplay
        appMode="pomodoro"
        blockMeta={blockMeta}
        remainingMs={remainingMs}
        isRunning={isRunning}
        onTogglePlayPause={onTogglePlayPause}
        onReset={onReset}
      />
    </div>
  );
}
