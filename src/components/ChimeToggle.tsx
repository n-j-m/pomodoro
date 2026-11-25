import { useAlertPreferences } from "#/hooks/use-alert-preferences";
import { Volume2, VolumeX } from "lucide-react";

export function ChimeToggle() {
  const { chimeEnabled, toggleChime } = useAlertPreferences();

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2.5 text-xs">
      <span className="inline-flex items-center gap-2 text-zinc-300">
        {chimeEnabled ? (
          <Volume2 className="h-3.5 w-3.5 text-rose-400 shrink-0" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        )}
        Completion chime: {chimeEnabled ? "On" : "Muted"}
      </span>
      <button
        type="button"
        onClick={toggleChime}
        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 font-medium text-zinc-200 transition shrink-0"
      >
        {chimeEnabled ? "Mute" : "Unmute"}
      </button>
    </div>
  );
}
