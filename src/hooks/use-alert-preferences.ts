import type { NotificationPermissionState } from "#/hooks/use-interval-notifications";
import type { ActiveBlockMeta, AppMode } from "#/types/timer";
import { createContext, useContext } from "react";

export interface IntervalCompletionAlertPayload {
  appMode: AppMode;
  completedBlock: ActiveBlockMeta;
  taskName: string;
  routineName?: string;
  nextBlock?: ActiveBlockMeta;
  willAutoAdvance: boolean;
}

export interface AlertPreferencesContextValue {
  notificationPermission: NotificationPermissionState;
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<NotificationPermissionState>;
  toggleNotificationsEnabled: () => Promise<void>;
  chimeEnabled: boolean;
  toggleChime: () => void;
  notifyCompletion: (payload: IntervalCompletionAlertPayload) => void;
}

export const AlertPreferencesContext = createContext<AlertPreferencesContextValue | null>(null);

export function useAlertPreferences(): AlertPreferencesContextValue {
  const ctx = useContext(AlertPreferencesContext);
  if (!ctx) {
    throw new Error("useAlertPreferences must be used within an AlertPreferencesProvider.");
  }
  return ctx;
}
