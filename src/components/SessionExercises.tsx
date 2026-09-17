import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { listExercises } from '../api/exercises';
import { addSessionExercise, deleteSessionExercise, listSessionExercises } from '../api/sessionExercises';
import { getProfile } from '../api/profile';
import { estimateCaloriesBurned } from '../lib/metValues';
import { EXERCISE_INTENSITY_LEVELS, type Exercise, type ExerciseIntensity, type SessionExercise } from '../types';

interface SessionExercisesProps {
  activityEntryId: string;
}

export function SessionExercises({ activityEntryId }: SessionExercisesProps) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [restSeconds, setRestSeconds] = useState('');
  const [duration, setDuration] = useState('');
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

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const exercise = exerciseByTitle.get(exerciseName.trim().toLowerCase());
    if (!exercise) {
      setError('Choisis un exercice de ta bibliothèque.');
      return;
    }
    const durationMinutes = duration ? parseFloat(duration) : null;
    const met = intensity ? EXERCISE_INTENSITY_LEVELS.find((l) => l.value === intensity)?.met : null;
    const calories =
      durationMinutes && met && weightKg ? estimateCaloriesBurned(met, weightKg, durationMinutes) : null;
    try {
      const created = await addSessionExercise({
        activity_entry_id: activityEntryId,
        exercise_id: exercise.id,
        sets: sets ? parseFloat(sets) : null,
        reps: reps ? parseFloat(reps) : null,
        rest_seconds: restSeconds ? parseFloat(restSeconds) : null,
        duration_minutes: durationMinutes,
        intensity_level: intensity || null,
        calories_kcal: calories,
        notes: null,
      });
      setSessionExercises((prev) => [...prev, created]);
      setExerciseName('');
      setSets('');
      setReps('');
      setRestSeconds('');
      setDuration('');
      setIntensity('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleRemove = async (id: string) => {
    await deleteSessionExercise(id);
    setSessionExercises((prev) => prev.filter((se) => se.id !== id));
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
                      {se.sets && se.reps ? ` — ${se.sets} × ${se.reps}` : ''}
                      {se.rest_seconds ? ` (repos ${se.rest_seconds}s)` : ''}
                      {se.duration_minutes ? ` · ${se.duration_minutes} min` : ''}
                      {se.intensity_level &&
                        ` · ${EXERCISE_INTENSITY_LEVELS.find((l) => l.value === se.intensity_level)?.label.split(' (')[0]}`}
                      {se.calories_kcal ? ` · ${Math.round(se.calories_kcal)} kcal` : ''}
                    </span>
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
          <form className="session-exercises-form" onSubmit={handleAdd}>
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
            <input
              type="number"
              step="any"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="Répétitions"
            />
            <input
              type="number"
              step="any"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
              placeholder="Repos (s)"
            />
            <input
              type="number"
              step="any"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Durée (min)"
            />
            <select value={intensity} onChange={(e) => setIntensity(e.target.value as ExerciseIntensity)}>
              <option value="">Intensité</option>
              {EXERCISE_INTENSITY_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <button type="submit">Ajouter</button>
          </form>
        </div>
      )}
    </div>
  );
}
