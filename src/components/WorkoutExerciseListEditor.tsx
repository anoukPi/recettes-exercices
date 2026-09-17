import { useEffect, useMemo, useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { listExercises } from '../api/exercises';
import type { Exercise, WorkoutSessionExercise } from '../types';

interface WorkoutExerciseListEditorProps {
  rows: WorkoutSessionExercise[];
  onChange: (rows: WorkoutSessionExercise[]) => void;
}

/** Compose une séance en choisissant des exercices de la bibliothèque —
 * même logique que les ingrédients d'une recette, mais on sélectionne dans
 * une liste fermée (pas de création à la volée, un exercice mérite sa propre
 * fiche avec photo/description). */
export function WorkoutExerciseListEditor({ rows, onChange }: WorkoutExerciseListEditorProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);

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
    updateRow(index, { exercise_id: match?.id ?? '' });
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { exercise_id: '', sets: null, reps: null, rest_seconds: null }]);
  };

  return (
    <div className="field">
      <label>Exercices de la séance</label>
      {exercises.length === 0 && (
        <p className="hint">
          Ajoute d'abord des exercices dans ta bibliothèque pour pouvoir composer une séance.
        </p>
      )}
      <div className="ingredient-rows">
        {rows.map((row, index) => (
          <div className="ingredient-row workout-exercise-row" key={index}>
            <SearchableSelect
              id={`workout-exercise-${index}`}
              value={exerciseById.get(row.exercise_id)?.title ?? ''}
              onChange={(v) => setRowName(index, v)}
              options={exercises.map((e) => e.title)}
              placeholder="Exercice"
              allowNew={false}
            />
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
              value={row.reps ?? ''}
              onChange={(e) => updateRow(index, { reps: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="Répétitions"
              aria-label="Répétitions"
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
            <button
              type="button"
              className="remove-row"
              onClick={() => removeRow(index)}
              aria-label="Supprimer cet exercice"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="add-row" onClick={addRow}>
        + Ajouter un exercice
      </button>
    </div>
  );
}
