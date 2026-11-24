import type { AppMode } from "#/types/timer";
import { Repeat, Timer } from "lucide-react";

interface ModeSwitcherProps {
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
}

export function ModeSwitcher({ appMode, onSelectMode }: ModeSwitcherProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900 p-1.5 border border-zinc-800">
      <button
        type="button"
        onClick={() => onSelectMode("pomodoro")}
        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
          appMode === "pomodoro"
            ? "bg-rose-600 text-white shadow"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Timer className="size-4" />
        Task Pomodoro
      </button>
      <button
        type="button"
        onClick={() => onSelectMode("routine")}
        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
          appMode === "routine"
            ? "bg-emerald-600 text-white shadow"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Repeat className="size-4" />
        Repeating Routine
      </button>
    </div>
  );
}
