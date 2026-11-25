import { useEffect, useState } from "react";
import { Activity, Flame } from "lucide-react";
import { fetchSessionStats, type CategoryStatsSummary, type StatsRange } from "#/data/stats";

interface SessionStatsSummaryProps {
  refreshKey: number;
}

const EMPTY_STATS: CategoryStatsSummary = {
  focusMinutes: 0,
  breakMinutes: 0,
  sitMinutes: 0,
  standMinutes: 0,
  moveMinutes: 0,
  totalPostureMinutes: 0,
  totalTrackedMinutes: 0,
};

export function SessionStatsSummary({ refreshKey }: SessionStatsSummaryProps) {
  const [range, setRange] = useState<StatsRange>("today");
  const [stats, setStats] = useState<CategoryStatsSummary>(EMPTY_STATS);

  useEffect(() => {
    let cancelled = false;
    void fetchSessionStats(range).then((result) => {
      console.log("fetched stats:", result);
      if (!cancelled) {
        setStats(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range, refreshKey]);

  const { focusMinutes, breakMinutes, sitMinutes, standMinutes, moveMinutes, totalPostureMinutes } =
    stats;

  const pct = (part: number) =>
    totalPostureMinutes > 0 ? Math.round((part / totalPostureMinutes) * 100) : 0;

  return (
    <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Session Summary
        </h2>

        <div className="inline-flex rounded-lg bg-zinc-950 p-1 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setRange("today")}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              range === "today" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setRange("all")}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              range === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Focus & Break Highlights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col justify-between rounded-xl bg-zinc-950 border border-zinc-800/90 p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            Total Focus
          </div>
          <div className="mt-auto pt-2 font-mono text-2xl font-bold text-white tabular-nums">
            {focusMinutes}
            <span className="ml-1 text-xs font-sans font-normal text-zinc-400">min</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-zinc-950 border border-zinc-800/90 p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            Active Posture (Stand + Move)
          </div>
          <div className="mt-auto pt-2 font-mono text-2xl font-bold text-white tabular-nums">
            {standMinutes + moveMinutes}
            <span className="ml-1 text-xs font-sans font-normal text-zinc-400">min</span>
          </div>
        </div>
      </div>

      {/* Sit / Stand / Move Breakdown */}
      <div className="space-y-2.5 rounded-xl bg-zinc-950 border border-zinc-800/90 p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-300">Sit / Stand / Move Breakdown</span>
          <span className="text-zinc-500">
            {totalPostureMinutes}m posture · {breakMinutes}m break
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-900 flex">
          {totalPostureMinutes > 0 ? (
            <>
              <div
                style={{ width: `${pct(sitMinutes)}%` }}
                className="bg-amber-500 transition-all"
                title={`Sit: ${sitMinutes}m (${pct(sitMinutes)}%)`}
              />
              <div
                style={{ width: `${pct(standMinutes)}%` }}
                className="bg-emerald-500 transition-all"
                title={`Stand: ${standMinutes}m (${pct(standMinutes)}%)`}
              />
              <div
                style={{ width: `${pct(moveMinutes)}%` }}
                className="bg-sky-400 transition-all"
                title={`Move: ${moveMinutes}m (${pct(moveMinutes)}%)`}
              />
            </>
          ) : (
            <div className="w-full bg-zinc-800/60" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-zinc-900/80 px-2.5 py-1.5">
            <span className="inline-flex items-center gap-1.5 text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Sit
            </span>
            <span className="font-mono text-zinc-200 tabular-nums">{sitMinutes}m</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-zinc-900/80 px-2.5 py-1.5">
            <span className="inline-flex items-center gap-1.5 text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Stand
            </span>
            <span className="font-mono text-zinc-200 tabular-nums">{standMinutes}m</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-zinc-900/80 px-2.5 py-1.5">
            <span className="inline-flex items-center gap-1.5 text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Move
            </span>
            <span className="font-mono text-zinc-200 tabular-nums">{moveMinutes}m</span>
          </div>
        </div>
      </div>
    </section>
  );
}
