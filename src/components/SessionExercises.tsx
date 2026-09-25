import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { ExerciseAmountFields, type ExerciseAmount } from './ExerciseAmountFields';
import { describePrescription, effortMinutes } from '../lib/exerciseFormat';
import { listExercises } from '../api/exercises';
import {
  addSessionExercise,
  deleteSessionExercise,
  listSessionExercises,
  updateSessionExercise,
} from '../api/sessionExercises';
import { getProfile } from '../api/profile';
import { estimateCaloriesBurned } from '../lib/metValues';
import { EXERCISE_INTENSITY_LEVELS, type Exercise, type ExerciseIntensity, type SessionExercise } from '../types';

const EMPTY_AMOUNT: ExerciseAmount = { reps: null, duration_minutes: null, duration_unit: null, load_kg: null };

interface SessionExercisesProps {
  activityEntryId: string;
}

export function SessionExercises({ activityEntryId }: SessionExercisesProps) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [amount, setAmount] = useState<ExerciseAmount>(EMPTY_AMOUNT);
  // Remonte le composant de saisie à chaque changement de ligne éditée, pour
  // qu'il reparte du bon mode (répétitions ou durée).
  const [amountKey, setAmountKey] = useState(0);
  const [restSeconds, setRestSeconds] = useState('');
  const [intensity, setIntensity] = useState<ExerciseIntensity | ''>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded || loaded) return;
    Promise.all([listSessionExercises(activityEntryId), listExercises(), getProfile()])
      .then(([se, ex, profile]) => {
        setSessionExercises(se);
        setExercises(ex);
        setWeightKg(profile?.weight_kg ?? null);
        setLoaded(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'));
  }, [expanded, loaded, activityEntryId]);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const exerciseByTitle = useMemo(
    () => new Map(exercises.map((e) => [e.title.toLowerCase(), e])),
    [exercises],
  );

  const totalCalories = sessionExercises.reduce((sum, se) => sum + (se.calories_kcal ?? 0), 0);

  const resetForm = () => {
    setEditingId(null);
    setExerciseName('');
    setSets('');
    setAmount(EMPTY_AMOUNT);
    setAmountKey((k) => k + 1);
    setRestSeconds('');
    setIntensity('');
  };

  const handleStartEdit = (se: SessionExercise) => {
    setEditingId(se.id);
    setExerciseName(exerciseById.get(se.exercise_id)?.title ?? '');
    setSets(se.sets != null ? String(se.sets) : '');
    setAmount({
      reps: se.reps,
      duration_minutes: se.duration_minutes,
      duration_unit: se.duration_unit,
      load_kg: se.load_kg,
    });
    setAmountKey((k) => k + 1);
    setRestSeconds(se.rest_seconds != null ? String(se.rest_seconds) : '');
    setIntensity(se.intensity_level ?? '');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const exercise = exerciseByTitle.get(exerciseName.trim().toLowerCase());
    if (!exercise) {
      setError('Choisis un exercice de ta bibliothèque.');
      return;
    }
    const setsCount = sets ? parseFloat(sets) : null;
    const met = intensity ? EXERCISE_INTENSITY_LEVELS.find((l) => l.value === intensity)?.met : null;
    // Durée donnée par série : l'effort total = séries × durée.
    const minutes = effortMinutes({ ...amount, sets: setsCount, rest_seconds: null });
    const calories = minutes && met && weightKg ? estimateCaloriesBurned(met, weightKg, minutes) : null;
    const input = {
      sets: setsCount,
      reps: amount.reps,
      rest_seconds: restSeconds ? parseFloat(restSeconds) : null,
      duration_minutes: amount.duration_minutes,
      duration_unit: amount.duration_minutes != null ? (amount.duration_unit ?? 'min') : null,
      load_kg: amount.load_kg,
      intensity_level: intensity || null,
      calories_kcal: calories,
      notes: null,
    };
    try {
      if (editingId) {
        const updated = await updateSessionExercise(editingId, input);
        setSessionExercises((prev) => prev.map((se) => (se.id === updated.id ? updated : se)));
      } else {
        const created = await addSessionExercise({
          activity_entry_id: activityEntryId,
          exercise_id: exercise.id,
          ...input,
        });
        setSessionExercises((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleRemove = async (id: string) => {
    await deleteSessionExercise(id);
    setSessionExercises((prev) => prev.filter((se) => se.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <div className="session-exercises">
      <button type="button" className="link-button" onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'Masquer les exercices' : 'Exercices de la séance'}
      </button>
      {expanded && (
        <div className="session-exercises-body">
          {error && <p className="error">{error}</p>}
          {!weightKg && (
            <p className="hint">
              Renseigne ton poids dans les Paramètres pour estimer les calories par exercice.
            </p>
          )}
          {sessionExercises.length > 0 && (
            <>
              <ul className="session-exercises-list">
                {sessionExercises.map((se) => (
                  <li key={se.id}>
                    <span>
                      {exerciseById.get(se.exercise_id)?.title ?? 'Exercice'}
                      {describePrescription(se) ? ` — ${describePrescription(se)}` : ''}
                      {se.intensity_level &&
                        ` · ${EXERCISE_INTENSITY_LEVELS.find((l) => l.value === se.intensity_level)?.label.split(' (')[0]}`}
                      {se.calories_kcal ? ` · ${Math.round(se.calories_kcal)} kcal` : ''}
                    </span>
                    <button type="button" className="link-button" onClick={() => handleStartEdit(se)}>
                      Modifier
                    </button>
                    <button type="button" className="remove-row" onClick={() => handleRemove(se.id)}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              {totalCalories > 0 && (
                <p className="hint session-exercises-total">
                  Total estimé : {Math.round(totalCalories)} kcal
                </p>
              )}
            </>
          )}
          <form className="session-exercises-form" onSubmit={handleSubmit}>
            <SearchableSelect
              id={`session-exercise-${activityEntryId}`}
              value={exerciseName}
              onChange={setExerciseName}
              options={exercises.map((e) => e.title)}
              placeholder="Exercice de ta bibliothèque"
              allowNew={false}
            />
            <input
              type="number"
              step="any"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="Séries"
            />
            <ExerciseAmountFields
              key={amountKey}
              idPrefix={`session-exercise-${activityEntryId}`}
              value={amount}
              onChange={(patch) => setAmount((prev) => ({ ...prev, ...patch }))}
            />
            <input
              type="number"
              step="any"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
              placeholder="Repos (s)"
            />
            <select value={intensity} onChange={(e) => setIntensity(e.target.value as ExerciseIntensity)}>
              <option value="">Intensité</option>
              {EXERCISE_INTENSITY_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <div className="activity-form-actions">
              <button type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</button>
              {editingId && (
                <button type="button" className="link-button" onClick={resetForm}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
