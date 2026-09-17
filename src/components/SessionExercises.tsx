import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { listExercises } from '../api/exercises';
import { addSessionExercise, deleteSessionExercise, listSessionExercises } from '../api/sessionExercises';
import type { Exercise, SessionExercise } from '../types';

interface SessionExercisesProps {
  activityEntryId: string;
}

export function SessionExercises({ activityEntryId }: SessionExercisesProps) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [restSeconds, setRestSeconds] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expanded || loaded) return;
    Promise.all([listSessionExercises(activityEntryId), listExercises()])
      .then(([se, ex]) => {
        setSessionExercises(se);
        setExercises(ex);
        setLoaded(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'));
  }, [expanded, loaded, activityEntryId]);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const exerciseByTitle = useMemo(
    () => new Map(exercises.map((e) => [e.title.toLowerCase(), e])),
    [exercises],
  );

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const exercise = exerciseByTitle.get(exerciseName.trim().toLowerCase());
    if (!exercise) {
      setError('Choisis un exercice de ta bibliothèque.');
      return;
    }
    try {
      const created = await addSessionExercise({
        activity_entry_id: activityEntryId,
        exercise_id: exercise.id,
        sets: sets ? parseFloat(sets) : null,
        reps: reps ? parseFloat(reps) : null,
        rest_seconds: restSeconds ? parseFloat(restSeconds) : null,
        notes: null,
      });
      setSessionExercises((prev) => [...prev, created]);
      setExerciseName('');
      setSets('');
      setReps('');
      setRestSeconds('');
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
          {sessionExercises.length > 0 && (
            <ul className="session-exercises-list">
              {sessionExercises.map((se) => (
                <li key={se.id}>
                  <span>
                    {exerciseById.get(se.exercise_id)?.title ?? 'Exercice'}
                    {se.sets && se.reps ? ` — ${se.sets} × ${se.reps}` : ''}
                    {se.rest_seconds ? ` (repos ${se.rest_seconds}s)` : ''}
                  </span>
                  <button type="button" className="remove-row" onClick={() => handleRemove(se.id)}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
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
            <button type="submit">Ajouter</button>
          </form>
        </div>
      )}
    </div>
  );
}
