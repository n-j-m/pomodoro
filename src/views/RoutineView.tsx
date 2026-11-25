import { RoutineControls } from "#/components/RoutineControls";
import { RoutineCreatorForm } from "#/components/RoutineCreatorForm";
import { TimerDisplay } from "#/components/TimerDisplay";
import type { SessionRoutine } from "#/data/schema";
import type { ActiveBlockMeta, RoutineWithSessions } from "#/types/timer";

interface RoutineViewProps {
  routines: RoutineWithSessions[];
  activeRoutine: RoutineWithSessions | undefined;
  stepIndex: number;
  autoAdvance: boolean;
  isFormOpen: boolean;
  editingRoutine: SessionRoutine | null;
  blockMeta: ActiveBlockMeta;
  remainingMs: number;
  isRunning: boolean;
  onOpenCreateForm: () => void;
  onOpenEditForm: (routine: SessionRoutine) => void;
  onCloseForm: () => void;
  onRoutineSaved: (routineId: number) => void | Promise<void>;
  onSelectRoutine: (routine: SessionRoutine) => void;
  onDeleteRoutine: (routineId: number) => void | Promise<void>;
  onToggleAutoAdvance: (checked: boolean) => void;
  onTogglePlayPause: () => void;
  onReset: () => void;
  onSkipStep: () => void;
}

export function RoutineView({
  routines,
  activeRoutine,
  stepIndex,
  autoAdvance,
  isFormOpen,
  editingRoutine,
  blockMeta,
  remainingMs,
  isRunning,
  onOpenCreateForm,
  onOpenEditForm,
  onCloseForm,
  onRoutineSaved,
  onSelectRoutine,
  onDeleteRoutine,
  onToggleAutoAdvance,
  onTogglePlayPause,
  onReset,
  onSkipStep,
}: RoutineViewProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Repeating Routine</span>
          <button
            type="button"
            onClick={() => (isFormOpen ? onCloseForm() : onOpenCreateForm())}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition"
          >
            {isFormOpen ? "Close Form" : "+ New Routine"}
          </button>
        </div>

        {isFormOpen ? (
          <RoutineCreatorForm
            key={editingRoutine?.id ?? "new-routine"}
            routineToEdit={editingRoutine}
            onSaved={onRoutineSaved}
            onCancel={onCloseForm}
          />
        ) : (
          <RoutineControls
            routines={routines}
            activeRoutine={activeRoutine}
            stepIndex={stepIndex}
            autoAdvance={autoAdvance}
            onSelectRoutine={onSelectRoutine}
            onEditRoutine={onOpenEditForm}
            onDeleteRoutine={onDeleteRoutine}
            onToggleAutoAdvance={onToggleAutoAdvance}
          />
        )}
      </div>

      <TimerDisplay
        appMode="routine"
        blockMeta={blockMeta}
        remainingMs={remainingMs}
        isRunning={isRunning}
        onTogglePlayPause={onTogglePlayPause}
        onReset={onReset}
        onSkipStep={onSkipStep}
      />
    </div>
  );
}
