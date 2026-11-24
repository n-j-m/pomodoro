import type { SessionRoutine } from "#/data/schema";
import type { RoutineWithSessions } from "#/types/timer";

interface RoutineControlsProps {
  routines: RoutineWithSessions[];
  activeRoutine: RoutineWithSessions | undefined;
  stepIndex: number;
  autoAdvance: boolean;
  onSelectRouting: (routine: SessionRoutine) => void;
  onToggleAutoAdvance: (checked: boolean) => void;
}

export function RoutineControls({
  routines,
  activeRoutine,
  stepIndex,
  autoAdvance,
  onSelectRouting,
  onToggleAutoAdvance,
}: RoutineControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {routines.map((routine) => {
          const selected = activeRoutine?.id === routine.id;
          return (
            <button
              key={routine.id}
              type="button"
              onClick={() => onSelectRouting(routine)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                selected
                  ? "bg-zinc-800 border-emerald-500 text-white"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {routine.name} ({routine.sessions.length} logged)
            </button>
          );
        })}
      </div>

      {activeRoutine && activeRoutine.steps.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-950 border border-zinc-800/90 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            {activeRoutine.steps.map((step, idx) => {
              const isCurrent = idx === stepIndex % activeRoutine.steps.length;
              return (
                <span
                  key={`${step.label}-${idx}`}
                  className={`rounded-md px-2 py-1 font-medium ${
                    isCurrent
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-zinc-500"
                  }`}
                >
                  {step.label} {Math.round(step.durationSeconds / 60)}m
                </span>
              );
            })}
          </div>

          <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => onToggleAutoAdvance(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 accent-emerald-500"
            />
            Auto-next
          </label>
        </div>
      )}
    </div>
  );
}
