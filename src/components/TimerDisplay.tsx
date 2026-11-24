import {
  formatCategoryBadge,
  formatDurationClock,
  type ActiveBlockMeta,
  type AppMode,
} from "#/types/timer";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

interface TimerDisplayProps {
  appMode: AppMode;
  blockMeta: ActiveBlockMeta;
  remainingMs: number;
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onReset: () => void;
  onSkipStep?: () => void;
}

export function TimerDisplay({
  appMode,
  blockMeta,
  remainingMs,
  isRunning,
  onTogglePlayPause,
  onReset,
  onSkipStep,
}: TimerDisplayProps) {
  return (
    <>
      <div className="text-center space-y-2 py-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {blockMeta.title} - {formatCategoryBadge(blockMeta.category)}
        </div>
        <div className="font-mono text-7xl font-bold tracking-tight tabular-nums text-white">
          {formatDurationClock(remainingMs)}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onTogglePlayPause}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition ${
            appMode === "pomodoro"
              ? "bg-rose-600 hover:bg-rose-500"
              : "bg-emerald-600 hover:bg-emerald-500"
          }`}
        >
          {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
          {isRunning ? "Pause" : "Start"}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-xl bg-zinc-800 hover:bg-zinc-700 p-3 text-zinc-300 transition"
          aria-label="Reset current interval"
        >
          <RotateCcw className="size-4" />
        </button>

        {appMode === "routine" && onSkipStep && (
          <button
            type="button"
            onClick={onSkipStep}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 p-3 text-zinc-300 transition"
            aria-label="Skip to next routine step"
          >
            <SkipForward className="size-4" />
          </button>
        )}
      </div>
    </>
  );
}
