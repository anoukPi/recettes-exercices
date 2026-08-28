import { useEffect, useState, type FormEvent } from 'react';
import { TagInput } from './TagInput';
import { formatTagList, parseTagList } from '../lib/tags';
import { listRecipeTags } from '../api/tags';
import type { Recipe, RecipeInput } from '../types';

interface RecipeFormProps {
  initial?: Recipe;
  onSubmit: (input: RecipeInput) => Promise<void>;
  submitLabel: string;
}

export function RecipeForm({ initial, onSubmit, submitLabel }: RecipeFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [instagramLink, setInstagramLink] = useState(initial?.instagram_link ?? '');
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? '');
  const [steps, setSteps] = useState(initial?.steps ?? '');
  const [tags, setTags] = useState(formatTagList(initial?.tags ?? []));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRecipeTags().then(setTagSuggestions).catch(() => {});
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
        ingredients: ingredients.trim() || null,
        steps: steps.trim() || null,
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
        <label htmlFor="recipe-title">Titre *</label>
        <input
          id="recipe-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="recipe-link">Lien Instagram</label>
        <input
          id="recipe-link"
          type="text"
          value={instagramLink}
          onChange={(e) => setInstagramLink(e.target.value)}
          placeholder="https://instagram.com/p/..."
        />
      </div>

      <div className="field">
        <label htmlFor="recipe-ingredients">Ingrédients</label>
        <textarea
          id="recipe-ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={6}
          placeholder={'Un ingrédient par ligne'}
        />
      </div>

      <div className="field">
        <label htmlFor="recipe-steps">Étapes de préparation</label>
        <textarea
          id="recipe-steps"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={6}
        />
      </div>

      <TagInput
        label="Tags"
        listId="recipe-tags"
        value={tags}
        onChange={setTags}
        suggestions={tagSuggestions}
      />

      <div className="field">
        <label htmlFor="recipe-notes">Notes personnelles</label>
        <textarea
          id="recipe-notes"
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
