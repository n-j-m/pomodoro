import { Bell, BellOff, ShieldAlert } from "lucide-react";
import type { NotificationPermissionState } from "#/hooks/use-interval-notifications";

interface NotificationBannerProps {
  permission: NotificationPermissionState;
  enabled: boolean;
  onRequestPermission: () => void | Promise<unknown>;
  onToggleEnabled: () => void | Promise<unknown>;
}

export function NotificationBanner({
  permission,
  enabled,
  onRequestPermission,
  onToggleEnabled,
}: NotificationBannerProps) {
  if (permission === "unsupported") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2.5 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <BellOff className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          Browser notifications are not supported in this environment.
        </span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-950/30 border border-amber-800/50 px-4 py-2.5 text-xs text-amber-200/90">
        <span className="inline-flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          Notifications blocked in browser site settings. Enable them in address bar permissions to
          get alerts.
        </span>
      </div>
    );
  }

  if (permission === "default") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs">
        <span className="inline-flex items-center gap-2 text-zinc-300">
          <Bell className="h-3.5 w-3.5 text-rose-400 shrink-0" />
          Get notified when a Pomodoro or routine interval finishes.
        </span>
        <button
          type="button"
          onClick={() => void onRequestPermission()}
          className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 font-medium text-white transition shrink-0"
        >
          Enable Alerts
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-2.5 text-xs">
      <span className="inline-flex items-center gap-2 text-zinc-300">
        {enabled ? (
          <Bell className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        ) : (
          <BellOff className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        )}
        Desktop notifications: {enabled ? "On" : "Muted"}
      </span>
      <button
        type="button"
        onClick={() => void onToggleEnabled()}
        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 font-medium text-zinc-200 transition shrink-0"
      >
        {enabled ? "Mute" : "Unmute"}
      </button>
    </div>
  );
}
