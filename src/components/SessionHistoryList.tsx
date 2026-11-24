import { formatCategoryBadge, type SessionWithRoutine } from "#/types/timer";
import { CheckCircle2 } from "lucide-react";

interface SessionHistoryListProps {
  sessions: SessionWithRoutine[];
}

export function SessionHistoryList({ sessions }: SessionHistoryListProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Recent Completed Intervals
      </h2>

      {sessions.length === 0 ? (
        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800/80 p-4 text-sm text-zinc-500">
          No completed sessions yet. Finish an interval to record it.
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  {entry.task ?? entry.routine?.name ?? entry.stepLabel}
                </div>
                {entry.routine && (
                  <span className="ml-2 text-xs text-emerald-400/90">[{entry.stepLabel}]</span>
                )}
              </div>

              <span className="text-xs text-zinc-400 shrink-0">
                {formatCategoryBadge(entry.category)} · {Math.round(entry.durationSeconds / 60)}m
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
