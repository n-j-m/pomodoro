import { POMODORO_PHASES, type PomodoroPhase } from "#/types/timer";

interface PomodoroControlsProps {
  phase: PomodoroPhase;
  taskName: string;
  onSelectPhase: (phase: PomodoroPhase) => void;
  onTaskNameChange: (value: string) => void;
}

export function PomodoroControls({
  phase,
  taskName,
  onSelectPhase,
  onTaskNameChange,
}: PomodoroControlsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(POMODORO_PHASES) as PomodoroPhase[]).map((phaseKey) => {
          const item = POMODORO_PHASES[phaseKey];
          const active = phase === phaseKey;
          return (
            <button
              key={phaseKey}
              type="button"
              onClick={() => onSelectPhase(phaseKey)}
              className={`rounded-lg py-2 px-3 text-xs font-medium border transition ${
                active
                  ? "bg-zinc-800 border-rose-500 text-white"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {item.label} ({Math.round(item.durationSeconds / 60)}m)
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={taskName}
        onChange={(e) => onTaskNameChange(e.target.value)}
        placeholder="Task name (e.g., Implement auth service)"
        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
      />
    </div>
  );
}
