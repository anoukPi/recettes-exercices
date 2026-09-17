import { useState, type FormEvent } from 'react';
import { WorkoutExerciseListEditor } from './WorkoutExerciseListEditor';
import type { WorkoutSession, WorkoutSessionInput } from '../types';

interface WorkoutSessionFormProps {
  initial?: WorkoutSession;
  onSubmit: (input: Omit<WorkoutSessionInput, 'user_id'>) => Promise<void>;
  submitLabel: string;
}

export function WorkoutSessionForm({ initial, onSubmit, submitLabel }: WorkoutSessionFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [exercises, setExercises] = useState(
    initial?.exercises && initial.exercises.length > 0
      ? initial.exercises
      : [
          {
            exercise_id: '',
            sets: null,
            reps: null,
            rest_seconds: null,
            duration_minutes: null,
            intensity_level: null,
          },
        ],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const cleanExercises = exercises.filter((row) => row.exercise_id);
    if (cleanExercises.length === 0) {
      setError('Ajoute au moins un exercice.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        exercises: cleanExercises,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}

      <div className="field">
        <label htmlFor="session-title">Titre *</label>
        <input
          id="session-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="session-description">Description</label>
        <textarea
          id="session-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <WorkoutExerciseListEditor rows={exercises} onChange={setExercises} />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Enregistrement…' : submitLabel}
      </button>
    </form>
  );
}
