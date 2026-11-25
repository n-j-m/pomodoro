import { Repeat, Timer } from "lucide-react";
import { Link, useLocation } from "wouter";

export function ModeSwitcher() {
  const [location] = useLocation();
  const isRoutine = location === "/routine";

  return (
    <nav
      aria-label="Timer mode"
      className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900 p-1.5 border border-zinc-800"
    >
      <Link
        href="/tasks"
        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
          !isRoutine ? "bg-rose-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Timer className="size-4" />
        Task Pomodoro
      </Link>
      <Link
        href="/routine"
        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
          isRoutine ? "bg-emerald-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Repeat className="size-4" />
        Repeating Routine
      </Link>
    </nav>
  );
}
