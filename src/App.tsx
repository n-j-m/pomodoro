import { ChimeToggle } from "#/components/ChimeToggle";
import { ClearDataButton } from "#/components/ClearDataButton";
import { NotificationBanner } from "#/components/NotificationBanner";
import { SessionStatsSummary } from "#/components/SessionStatsSummary";
import { useSessionsAndRoutines } from "#/hooks/use-sessions-and-routines";
import { AppProviders } from "#/providers/AppProviders";
import { PomodoroView } from "#/views/PomodoroView";
import { RoutineView } from "#/views/RoutineView";
import { Redirect, Route, Router, Switch } from "wouter";
import { ModeSwitcher } from "./components/ModeSwitcher";
import { SessionHistoryList } from "./components/SessionHistoryList";

const ROUTER_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function TimerShell() {
  const { isDbReady } = useSessionsAndRoutines();

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-sm">
        Loading PGlite &amp; running Drizzle migrations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4">
      <div className="mx-auto max-w-xl space-y-6">
        <ModeSwitcher />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <NotificationBanner />
          <ChimeToggle />
        </div>

        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8">
          <Switch>
            <Route
              path="/tasks"
              component={PomodoroView}
            />
            <Route
              path="/routine"
              component={RoutineView}
            />
            <Route>
              <Redirect
                to="/tasks"
                replace
              />
            </Route>
          </Switch>
        </section>

        <SessionStatsSummary />

        <SessionHistoryList />

        <footer className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs text-zind-500">
          <span>Stored locally.</span>
          <ClearDataButton />
        </footer>
      </div>
    </div>
  );
}

export function App() {
  return (
    <Router base={ROUTER_BASE}>
      <AppProviders>
        <TimerShell />
      </AppProviders>
    </Router>
  );
}

export default App;
