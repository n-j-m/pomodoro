import { db } from "#/data/client";
import {
  sessionRoutines,
  type RoutineStep,
  type SessionCategory,
  type SessionRoutine,
} from "#/data/schema";
import type { SaveRoutineInput } from "#/hooks/use-sessions-and-routines";
import { eq } from "drizzle-orm";
import { Plus, Trash2 } from "lucide-react";
import { useState, type SubmitEvent } from "react";

interface DraftStep {
  id: string;
  label: string;
  category: SessionCategory;
  durationMinutes: number;
}

interface RoutineCreatorFormProps {
  routineToEdit?: SessionRoutine | null;
  onSaved?: (routine: SaveRoutineInput) => void | Promise<void>;
  onCancel?: () => void;
}

const CATEGORIES: { value: SessionCategory; label: string }[] = [
  { value: "sit", label: "Sit" },
  { value: "stand", label: "Stand" },
  { value: "move", label: "Move" },
  { value: "focus", label: "Focus" },
  { value: "break", label: "Break" },
];

function createDraftStep(partial?: Partial<Omit<DraftStep, "id">>): DraftStep {
  return {
    id: crypto.randomUUID(),
    label: partial?.label ?? "Stand",
    category: partial?.category ?? "stand",
    durationMinutes: partial?.durationMinutes ?? 8,
  };
}

function routineToDraftSteps(routine: SessionRoutine): DraftStep[] {
  if (routine.steps.length === 0) {
    return [createDraftStep()];
  }
  return routine.steps.map((step) =>
    createDraftStep({
      label: step.label,
      category: step.category,
      durationMinutes: Number((step.durationSeconds / 60).toFixed(2)),
    }),
  );
}

const DEFAULT_STEPS: () => DraftStep[] = () => [
  createDraftStep({ label: "Sit", category: "sit", durationMinutes: 20 }),
  createDraftStep({ label: "Stand", category: "stand", durationMinutes: 8 }),
  createDraftStep({ label: "Move", category: "move", durationMinutes: 2 }),
];

export function RoutineCreatorForm({ routineToEdit, onSaved, onCancel }: RoutineCreatorFormProps) {
  const isEditing = Boolean(routineToEdit);

  const [name, setName] = useState(() => routineToEdit?.name ?? "");
  const [repeatIndefinitely, setRepeatIndefinitely] = useState(
    () => routineToEdit?.repeatIndefinitely ?? true,
  );
  const [autoAdvance, setAutoAdvance] = useState(() => routineToEdit?.autoAdvance ?? true);
  const [steps, setSteps] = useState<DraftStep[]>(() =>
    routineToEdit ? routineToDraftSteps(routineToEdit) : DEFAULT_STEPS(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStep = (id: string, patch: Partial<Omit<DraftStep, "id">>) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  };

  const addStep = () => {
    setSteps((prev) => [...prev, createDraftStep()]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter a routine name.");
      return;
    }

    const normalizedSteps: RoutineStep[] = [];
    for (const step of steps) {
      const minutes = Number(step.durationMinutes);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        setErrorMessage("Every step duration must be greater than 0 minutes.");
        return;
      }

      const fallbackLabel = CATEGORIES.find((c) => c.value === step.category)?.label ?? "Step";

      normalizedSteps.push({
        label: step.label.trim() || fallbackLabel,
        category: step.category,
        durationSeconds: Math.round(minutes * 60),
      });
    }

    setIsSubmitting(true);
    try {
      let saved: SaveRoutineInput | undefined;

      if (routineToEdit) {
        const [updated] = await db
          .update(sessionRoutines)
          .set({
            name: trimmedName,
            steps: normalizedSteps,
            repeatIndefinitely,
            autoAdvance,
          })
          .where(eq(sessionRoutines.id, routineToEdit.id))
          .returning();
        saved = {
          id: updated.id,
          name: updated.name,
          autoAdvance: updated.autoAdvance,
          repeatIndefinitiely: updated.repeatIndefinitely,
          steps: updated.steps,
        };
      } else {
        const [inserted] = await db
          .insert(sessionRoutines)
          .values({
            name: trimmedName,
            steps: normalizedSteps,
            repeatIndefinitely,
            autoAdvance,
          })
          .returning();
        saved = {
          id: inserted.id,
          name: inserted.name,
          autoAdvance: inserted.autoAdvance,
          repeatIndefinitiely: inserted.repeatIndefinitely,
          steps: inserted.steps,
        };
      }

      if (saved !== undefined && onSaved) {
        await onSaved(saved);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save routine to PGlite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
          {isEditing ? `Edit "${routineToEdit?.name}"` : "New Repeating Routine"}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="routine-name"
          className="block text-xs font-medium text-zinc-400"
        >
          Routine Name
        </label>
        <input
          id="routine-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., 20-8-2 Sit / Stand / Move"
          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Interval Steps (in minutes)</span>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Step
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="grid grid-cols-12 gap-2 items-center rounded-xl bg-zinc-950 border border-zinc-800/90 p-2.5"
            >
              <span className="col-span-1 text-center font-mono text-xs text-zinc-500">
                {index + 1}
              </span>

              <input
                type="text"
                value={step.label}
                onChange={(e) => updateStep(step.id, { label: e.target.value })}
                placeholder="Label"
                aria-label={`Step ${index + 1} label`}
                className="col-span-5 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              />

              <select
                value={step.category}
                onChange={(e) =>
                  updateStep(step.id, {
                    category: e.target.value as SessionCategory,
                  })
                }
                aria-label={`Step ${index + 1} category`}
                className="col-span-3 rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option
                    key={cat.value}
                    value={cat.value}
                  >
                    {cat.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0.0}
                step={0.5}
                value={step.durationMinutes}
                onChange={(e) =>
                  updateStep(step.id, {
                    durationMinutes: Number(e.target.value),
                  })
                }
                aria-label={`Step ${index + 1} duration in minutes`}
                className="col-span-2 rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => removeStep(step.id)}
                disabled={steps.length <= 1}
                aria-label={`Remove step ${index + 1}`}
                className="col-span-1 flex justify-center rounded-lg p-1.5 text-zinc-400 hover:text-rose-400 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-zinc-300">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={repeatIndefinitely}
            onChange={(e) => setRepeatIndefinitely(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 accent-emerald-500"
          />
          Repeat cycle indefinitely
        </label>

        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 accent-emerald-500"
          />
          Auto-advance steps
        </label>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-rose-950/60 border border-rose-800/70 px-3 py-2 text-xs text-rose-300">
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Routine" : "Save Routine"}
        </button>
      </div>
    </form>
  );
}
