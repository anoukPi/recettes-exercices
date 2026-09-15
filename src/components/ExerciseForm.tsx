import { useEffect, useState, type FormEvent } from 'react';
import { TagInput } from './TagInput';
import { formatTagList, parseTagList } from '../lib/tags';
import { listExerciseMuscles, listExerciseTags } from '../api/tags';
import type { Exercise, ExerciseInput } from '../types';

interface ExerciseFormProps {
  initial?: Exercise;
  onSubmit: (input: Omit<ExerciseInput, 'user_id'>) => Promise<void>;
  submitLabel: string;
}

export function ExerciseForm({ initial, onSubmit, submitLabel }: ExerciseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [instagramLink, setInstagramLink] = useState(initial?.instagram_link ?? '');
  const [muscles, setMuscles] = useState(formatTagList(initial?.muscles ?? []));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [tags, setTags] = useState(formatTagList(initial?.tags ?? []));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [muscleSuggestions, setMuscleSuggestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExerciseTags().then(setTagSuggestions).catch(() => {});
    listExerciseMuscles().then(setMuscleSuggestions).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        instagram_link: instagramLink.trim() || null,
        muscles: parseTagList(muscles),
        description: description.trim() || null,
        tags: parseTagList(tags),
        notes: notes.trim() || null,
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
        <label htmlFor="exercise-title">Titre *</label>
        <input
          id="exercise-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="exercise-link">Lien Instagram</label>
        <input
          id="exercise-link"
          type="text"
          value={instagramLink}
          onChange={(e) => setInstagramLink(e.target.value)}
          placeholder="https://instagram.com/p/..."
        />
      </div>

      <TagInput
        label="Muscles ciblés"
        listId="exercise-muscles"
        value={muscles}
        onChange={setMuscles}
        suggestions={muscleSuggestions}
        placeholder="ex: dos, fessiers, abdominaux"
      />

      <div className="field">
        <label htmlFor="exercise-description">Description / consignes</label>
        <textarea
          id="exercise-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
        />
      </div>

      <TagInput
        label="Tags"
        listId="exercise-tags"
        value={tags}
        onChange={setTags}
        suggestions={tagSuggestions}
        placeholder="ex: cardio, maison, sans matériel"
      />

      <div className="field">
        <label htmlFor="exercise-notes">Notes personnelles</label>
        <textarea
          id="exercise-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Enregistrement…' : submitLabel}
      </button>
    </form>
  );
}
