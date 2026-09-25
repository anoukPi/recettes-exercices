import { useEffect, useMemo, useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { ExerciseAmountFields } from './ExerciseAmountFields';
import { createExercise, listExercises } from '../api/exercises';
import { EXERCISE_INTENSITY_LEVELS, type Exercise, type ExerciseIntensity, type WorkoutSessionExercise } from '../types';

interface WorkoutExerciseListEditorProps {
  rows: WorkoutSessionExercise[];
  onChange: (rows: WorkoutSessionExercise[]) => void;
}

/** Compose une séance en choisissant des exercices de la bibliothèque. Un
 * exercice absent peut être créé sur place (décision UX du 24/09/2026) : il
 * rejoint la bibliothèque avec son seul nom, à compléter plus tard dans sa
 * fiche (photo, muscles, description). */
export function WorkoutExerciseListEditor({ rows, onChange }: WorkoutExerciseListEditorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  // Texte tapé dans chaque ligne, tant qu'il ne correspond pas (encore) à un
  // exercice de la bibliothèque — sans ça, le champ se vidait à chaque lettre.
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    listExercises().then(setExercises).catch(() => {});
  }, []);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const exerciseByTitle = useMemo(
    () => new Map(exercises.map((e) => [e.title.toLowerCase(), e])),
    [exercises],
  );

  const updateRow = (index: number, patch: Partial<WorkoutSessionExercise>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const setRowName = (index: number, name: string) => {
    const match = exerciseByTitle.get(name.trim().toLowerCase());
    setDrafts((prev) => ({ ...prev, [index]: name }));
    updateRow(index, { exercise_id: match?.id ?? '' });
  };

  const createAndSelect = async (index: number, name: string) => {
    const title = name.trim();
    if (!title) return;
    const existing = exerciseByTitle.get(title.toLowerCase());
    if (existing) {
      updateRow(index, { exercise_id: existing.id });
      return;
    }
    setCreateError(null);
    try {
      const created = await createExercise({
        title,
        instagram_link: null,
        photo_url: null,
        video_url: null,
        muscles: [],
        description: null,
        tags: [],
        notes: null,
      });
      setExercises((prev) => [created, ...prev]);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      updateRow(index, { exercise_id: created.id });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "L'exercice n'a pas pu être créé.");
    }
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
    // Les brouillons sont indexés par position : on décale ceux d'après.
    setDrafts((prev) => {
      const next: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const i = Number(k);
        if (i < index) next[i] = v;
        else if (i > index) next[i - 1] = v;
      }
      return next;
    });
  };

  const addRow = () => {
    onChange([
      ...rows,
      {
        exercise_id: '',
        sets: null,
        reps: null,
        rest_seconds: null,
        duration_minutes: null,
        duration_unit: null,
        load_kg: null,
        intensity_level: null,
      },
    ]);
  };

  return (
    <div className="field">
      <label>Exercices de la séance</label>
      <p className="hint">
        Tape le nom d'un exercice : choisis-le dans ta bibliothèque, ou crée-le sur place s'il
        n'existe pas encore (tu pourras compléter sa fiche plus tard).
      </p>
      {createError && <p className="error">{createError}</p>}
      <p className="hint">
        Pour chaque exercice : des répétitions <em>ou</em> une durée par série (sec, min ou h), une
        charge si tu es lestée, le repos et l'intensité. C'est le plan — tu pourras l'ajuster au
        moment de noter la séance.
      </p>
      <div className="ingredient-rows">
        {rows.map((row, index) => (
          <div className="workout-exercise-row-wrap" key={index}>
            <SearchableSelect
              id={`workout-exercise-${index}`}
              className="workout-exercise-name-field"
              value={exerciseById.get(row.exercise_id)?.title ?? drafts[index] ?? ''}
              onChange={(v) => setRowName(index, v)}
              onAddNew={(v) => void createAndSelect(index, v)}
              options={exercises.map((e) => e.title)}
              placeholder="Exercice"
              newLabel="Créer l'exercice"
            />
            <ExerciseAmountFields
              idPrefix={`workout-exercise-${index}`}
              value={{
                reps: row.reps,
                duration_minutes: row.duration_minutes,
                duration_unit: row.duration_unit ?? null,
                load_kg: row.load_kg ?? null,
              }}
              onChange={(patch) => updateRow(index, patch)}
            />
            <div className="workout-exercise-row-rest">
              <input
                type="number"
                step="1"
                min="0"
                className="ingredient-qty"
                value={row.sets ?? ''}
                onChange={(e) => updateRow(index, { sets: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Séries"
                aria-label="Séries"
              />
              <input
                type="number"
                step="1"
                min="0"
                className="ingredient-qty"
                value={row.rest_seconds ?? ''}
                onChange={(e) =>
                  updateRow(index, { rest_seconds: e.target.value ? parseFloat(e.target.value) : null })
                }
                placeholder="Repos (s)"
                aria-label="Repos en secondes"
              />
              <select
                value={row.intensity_level ?? ''}
                onChange={(e) =>
                  updateRow(index, { intensity_level: (e.target.value || null) as ExerciseIntensity | null })
                }
                aria-label="Intensité"
              >
                <option value="">Intensité</option>
                {EXERCISE_INTENSITY_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="remove-row"
                onClick={() => removeRow(index)}
                aria-label="Supprimer cet exercice"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="add-row" onClick={addRow}>
        + Ajouter un exercice
      </button>
    </div>
  );
}
