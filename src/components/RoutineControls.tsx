import { Pencil, Trash2 } from "lucide-react";
import type { SessionRoutine } from "#/data/schema";
import type { RoutineWithSessions } from "#/types/timer";

interface RoutineControlsProps {
  routines: RoutineWithSessions[];
  activeRoutine: RoutineWithSessions | undefined;
  stepIndex: number;
  autoAdvance: boolean;
  onSelectRoutine: (routine: SessionRoutine) => void;
  onEditRoutine: (routine: SessionRoutine) => void;
  onDeleteRoutine: (routineId: number) => void | Promise<void>;
  onToggleAutoAdvance: (checked: boolean) => void;
}

export function RoutineControls({
  routines,
  activeRoutine,
  stepIndex,
  autoAdvance,
  onSelectRoutine,
  onEditRoutine,
  onDeleteRoutine,
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
              onClick={() => onSelectRoutine(routine)}
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

      {activeRoutine && (
        <div className="space-y-2.5 rounded-xl bg-zinc-950 border border-zinc-800/90 p-3.5 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
            <span className="font-medium text-zinc-200">{activeRoutine.name}</span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEditRoutine(activeRoutine)}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 text-zinc-300 transition"
                aria-label={`Edit ${activeRoutine.name}`}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>

              <button
                type="button"
                onClick={() => void onDeleteRoutine(activeRoutine.id)}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 hover:bg-rose-950/70 border border-zinc-800 hover:border-rose-800/70 px-2.5 py-1 text-zinc-300 hover:text-rose-300 transition"
                aria-label={`Delete ${activeRoutine.name}`}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {activeRoutine.steps.map((step, idx) => {
                const isCurrent =
                  activeRoutine.steps.length > 0 && idx === stepIndex % activeRoutine.steps.length;
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
        </div>
      )}
    </div>
  );
}
