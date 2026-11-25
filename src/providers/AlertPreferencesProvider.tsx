import {
  AlertPreferencesContext,
  type AlertPreferencesContextValue,
  type IntervalCompletionAlertPayload,
} from "#/hooks/use-alert-preferences";
import { useIntervalChime } from "#/hooks/use-interval-chime";
import { useIntervalNotifications } from "#/hooks/use-interval-notifications";
import { useCallback, useMemo, type ReactNode } from "react";

export function AlertPreferencesProvider({ children }: { children: ReactNode }) {
  const {
    permission: notificationPermission,
    enabled: notificationsEnabled,
    requestPermission: requestNotificationPermission,
    toggleEnabled: toggleNotificationsEnabled,
    notifyIntervalComplete,
  } = useIntervalNotifications();

  const { chimeEnabled, toggleChime, playChime } = useIntervalChime();

  const notifyCompletion = useCallback(
    (payload: IntervalCompletionAlertPayload) => {
      void playChime(payload.appMode);
      notifyIntervalComplete(payload);
    },
    [playChime, notifyIntervalComplete],
  );

  const value = useMemo<AlertPreferencesContextValue>(
    () => ({
      notificationPermission,
      notificationsEnabled,
      requestNotificationPermission,
      toggleNotificationsEnabled,
      chimeEnabled,
      toggleChime,
      notifyCompletion,
    }),
    [
      notificationPermission,
      notificationsEnabled,
      requestNotificationPermission,
      toggleNotificationsEnabled,
      chimeEnabled,
      toggleChime,
      notifyCompletion,
    ],
  );

  return (
    <AlertPreferencesContext.Provider value={value}>{children}</AlertPreferencesContext.Provider>
  );
}
