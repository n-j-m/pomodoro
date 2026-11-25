import { AlertPreferencesProvider } from "#/providers/AlertPreferencesProvider";
import { SessionsAndRoutinesProvider } from "#/providers/SessionsAndRoutinesProvider";
import { TimerClockProvider } from "#/providers/TimerClockProvider";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AlertPreferencesProvider>
      <SessionsAndRoutinesProvider>
        <TimerClockProvider>{children}</TimerClockProvider>
      </SessionsAndRoutinesProvider>
    </AlertPreferencesProvider>
  );
}
