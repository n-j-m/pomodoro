import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

interface ClearDataButtonProps {
  onClearData: () => Promise<void> | void;
}

export function ClearDataButton({ onClearData }: ClearDataButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleConfirm = async () => {
    setIsClearing(true);
    try {
      await onClearData();
      setConfirming(false);
    } finally {
      setIsClearing(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear Data
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-rose-950/50 border border-rose-800/70 px-3 py-1.5 text-xs">
      <span className="text-rose-200 font-medium">Reset to initial state?</span>
      <button
        type="button"
        disabled={isClearing}
        onClick={() => void handleConfirm()}
        className="rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-2.5 py-1 font-semibold text-white transition"
      >
        {isClearing ? "Resetting..." : "Confirm"}
      </button>
      <button
        type="button"
        disabled={isClearing}
        onClick={() => setConfirming(false)}
        className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-zinc-300 transition"
      >
        <RotateCcw className="h-3 w-3" />
        Cancel
      </button>
    </div>
  );
}
