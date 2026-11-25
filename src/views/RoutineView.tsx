import { RoutineControls } from "#/components/RoutineControls";
import { RoutineCreatorForm } from "#/components/RoutineCreatorForm";
import { TimerDisplay } from "#/components/TimerDisplay";
import { useSessionsAndRoutines } from "#/hooks/use-sessions-and-routines";
import { useTimerClock } from "#/hooks/use-timer-clock";

export function RoutineView() {
  const {
    routines,
    activeRoutine,
    stepIndex,
    autoAdvanceRoutine,
    isFormOpen,
    editingRoutine,
    openCreateForm,
    openEditForm,
    closeForm,
    selectRoutine,
    saveRoutine,
    deleteRoutine,
    setAutoAdvanceRoutine,
    advanceRoutineStepManually,
  } = useSessionsAndRoutines();

  const {
    currentBlockMeta,
    remainingMs,
    isRunning,
    togglePlayPause,
    reset,
    syncRoutineSelection,
    syncAfterRoutineSave,
    syncAfterRoutineDelete,
    syncStepSkip,
  } = useTimerClock();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Repeating Routine</span>
          <button
            type="button"
            onClick={() => (isFormOpen ? closeForm() : openCreateForm())}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition"
          >
            {isFormOpen ? "Close Form" : "+ New Routine"}
          </button>
        </div>

        {isFormOpen ? (
          <RoutineCreatorForm
            key={editingRoutine?.id ?? "new-routine"}
            routineToEdit={editingRoutine}
            onSaved={async (input) => {
              const saved = await saveRoutine(input);
              syncAfterRoutineSave(saved);
            }}
            onCancel={closeForm}
          />
        ) : (
          <RoutineControls
            routines={routines}
            activeRoutine={activeRoutine}
            stepIndex={stepIndex}
            autoAdvance={autoAdvanceRoutine}
            onSelectRoutine={(routine) => {
              selectRoutine(routine);
              syncRoutineSelection(routine);
            }}
            onEditRoutine={openEditForm}
            onDeleteRoutine={async (routineId) => {
              const nextRoutine = await deleteRoutine(routineId);
              syncAfterRoutineDelete(nextRoutine);
            }}
            onToggleAutoAdvance={setAutoAdvanceRoutine}
          />
        )}
      </div>

      <TimerDisplay
        appMode="routine"
        blockMeta={currentBlockMeta}
        remainingMs={remainingMs}
        isRunning={isRunning}
        onTogglePlayPause={togglePlayPause}
        onReset={reset}
        onSkipStep={() => {
          advanceRoutineStepManually();
          syncStepSkip();
        }}
      />
    </div>
  );
}
