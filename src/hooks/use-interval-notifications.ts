import type { ActiveBlockMeta, AppMode } from "#/types/timer";
import { useCallback, useState } from "react";

export type NotificationPermissionState = NotificationPermission | "unsupported";

interface NotifyIntervalCompleteParams {
  appMode: AppMode;
  completedBlock: ActiveBlockMeta;
  taskName: string;
  routineName?: string;
  nextBlock?: ActiveBlockMeta;
  willAutoAdvance?: boolean;
  onFocusApp?: () => void;
}

function getInitialPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function useIntervalNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>(getInitialPermission);
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    return Notification.permission === "granted";
  });

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      setEnabled(false);
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      setPermission("granted");
      setEnabled(true);
      return "granted";
    }

    if (Notification.permission === "denied") {
      setPermission("denied");
      setEnabled(false);
      return "denied";
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    setEnabled(result === "granted");
    return result;
  }, []);

  const toggleEnabled = useCallback(async () => {
    if (permission === "unsupported" || permission === "denied") {
      return;
    }

    if (permission !== "granted") {
      await requestPermission();
      return;
    }

    setEnabled((prev) => !prev);
  }, [permission, requestPermission]);

  const notifyIntervalComplete = useCallback(
    ({
      appMode,
      completedBlock,
      taskName,
      routineName,
      nextBlock,
      willAutoAdvance,
      onFocusApp,
    }: NotifyIntervalCompleteParams) => {
      if (!enabled || permission !== "granted") return;
      if (typeof window === "undefined" || !("Notification" in window)) return;

      const title =
        appMode === "pomodoro"
          ? `${completedBlock.title} complete — ${taskName.trim() || "Untitled Task"}`
          : `${routineName ?? "Routine"}: ${completedBlock.title} complete`;

      const body = nextBlock
        ? willAutoAdvance
          ? `Starting next: ${nextBlock.title} (${Math.round(nextBlock.durationSeconds / 60)}m)`
          : `Up next: ${nextBlock.title} (${Math.round(nextBlock.durationSeconds / 60)}m)`
        : "Interval finished.";

      const notification = new Notification(title, {
        body,
        tag: `pomodoro-pglite-${appMode}`,
      });

      notification.onclick = () => {
        window.focus();
        onFocusApp?.();
        notification.close();
      };
    },
    [enabled, permission],
  );

  return {
    permission,
    enabled,
    requestPermission,
    toggleEnabled,
    notifyIntervalComplete,
  };
}
