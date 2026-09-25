import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { TagInput } from './TagInput';
import { IngredientListEditor } from './IngredientListEditor';
import { formatTagList, parseTagList } from '../lib/tags';
import { listRecipeTags } from '../api/tags';
import { uploadRecipePhoto } from '../api/storage';
import { extractInstagramLink, parseCaption } from '../lib/captionParser';
import { recognizeRecipePhoto } from '../lib/ocr';
import { DictationButton } from './DictationButton';
import { RECIPE_CATEGORIES, type Recipe, type RecipeInput, type RecipeIngredient } from '../types';

// Suggestions de départ toujours proposées, même avant d'avoir jamais été
// utilisées sur une recette — catégories de plat + régimes courants.
const STARTER_TAGS = [
  'Entrée', 'Plat', 'Dessert', 'Pain', 'Petit-déjeuner', 'Apéritif', 'Sauce',
  'Sans sucre', 'Sans gluten', 'Végétarien', 'Végan', 'Sans lactose',
];

interface RecipeFormProps {
  initial?: Recipe;
  onSubmit: (input: Omit<RecipeInput, 'user_id'>) => Promise<void>;
  submitLabel: string;
}

export function RecipeForm({ initial, onSubmit, submitLabel }: RecipeFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [instagramLink, setInstagramLink] = useState(initial?.instagram_link ?? '');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    initial?.ingredients && initial.ingredients.length > 0
      ? initial.ingredients
      : [{ quantity: '', unit: '', ingredient: '' }],
  );
  const [steps, setSteps] = useState(initial?.steps ?? '');
  const [tags, setTags] = useState(formatTagList(initial?.tags ?? []));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [servings, setServings] = useState(initial?.servings ? String(initial.servings) : '');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photo_url ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const handleExtractCaption = () => {
    if (!captionInput.trim()) return;
    const { link, text } = extractInstagramLink(captionInput);
    if (link) setInstagramLink(link);
    const parsed = parseCaption(text);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.ingredients.length > 0) setIngredients(parsed.ingredients);
    if (parsed.steps) setSteps(parsed.steps);
  };

  const handleOcrPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOcrError(null);
    setOcrLoading(true);
    try {
      const text = await recognizeRecipePhoto(file);
      if (!text) {
        setOcrError("Aucun texte reconnu sur cette photo — réessaie avec une image plus nette.");
        return;
      }
      setCaptionInput((prev) => (prev ? `${prev}\n${text}` : text));
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "Erreur lors de la lecture de la photo.");
    } finally {
      setOcrLoading(false);
    }
  };

  useEffect(() => {
    listRecipeTags()
      .then((used) => setTagSuggestions(Array.from(new Set([...STARTER_TAGS, ...used]))))
      .catch(() => setTagSuggestions(STARTER_TAGS));
  }, []);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoRemoved(false);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoRemoved(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const servingsNumber = servings.trim() ? Number(servings) : null;
    if (servingsNumber !== null && (!Number.isInteger(servingsNumber) || servingsNumber < 1 || servingsNumber > 200)) {
      setError('Le nombre de parts doit être un nombre entier (1 à 200).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let photoUrl = initial?.photo_url ?? null;
      if (photoFile) {
        photoUrl = await uploadRecipePhoto(photoFile);
      } else if (photoRemoved) {
        photoUrl = null;
      }

      const cleanIngredients = ingredients.filter(
        (row) => row.quantity.trim() || row.unit.trim() || row.ingredient.trim(),
      );

      await onSubmit({
        title: title.trim(),
        instagram_link: instagramLink.trim() || null,
        photo_url: photoUrl,
        ingredients: cleanIngredients,
        steps: steps.trim() || null,
        tags: parseTagList(tags),
        notes: notes.trim() || null,
        category: category || null,
        servings: servingsNumber,
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

      <div className="field caption-import">
        <label htmlFor="recipe-caption">
          Importer depuis une légende Instagram, une dictée ou une photo (optionnel)
        </label>
        <textarea
          id="recipe-caption"
          value={captionInput}
          onChange={(e) => setCaptionInput(e.target.value)}
          rows={4}
          placeholder="Colle ici le lien Instagram et/ou la légende du post — titre, Ingrédients :, Étapes : si présents"
        />
        {ocrError && <p className="error">{ocrError}</p>}
        <div className="caption-import-actions">
          <button type="button" onClick={handleExtractCaption} disabled={!captionInput.trim()}>
            Extraire dans le formulaire
          </button>
          <DictationButton
            title="Dicter la légende (ingrédients, étapes...)"
            onResult={(text) => setCaptionInput((prev) => (prev ? `${prev}\n${text}` : text))}
          />
          <label className="ocr-photo-button">
            {ocrLoading ? 'Lecture de la photo…' : '📷 Depuis une photo'}
            <input type="file" accept="image/*" onChange={handleOcrPhoto} disabled={ocrLoading} />
          </label>
        </div>
        <p className="hint">
          Un lien Instagram collé ici est reconnu automatiquement et rempli dans "Lien
          Instagram" plus bas. La reconnaissance de texte sur la photo tourne dans le navigateur
          et n'est pas parfaite — relis et corrige le texte reconnu avant de cliquer sur
          "Extraire dans le formulaire".
        </p>
      </div>

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
        <label htmlFor="recipe-photo">Photo</label>
        {photoPreview && (
          <div className="photo-preview">
            <img src={photoPreview} alt="Aperçu de la recette" />
            <button type="button" className="link-button" onClick={handleRemovePhoto}>
              Retirer la photo
            </button>
          </div>
        )}
        <input id="recipe-photo" type="file" accept="image/*" onChange={handlePhotoChange} />
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
        <label htmlFor="recipe-category">Catégorie</label>
        <select id="recipe-category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">—</option>
          {RECIPE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="recipe-servings">Nombre de parts</label>
        <input
          id="recipe-servings"
          type="number"
          inputMode="numeric"
          min={1}
          max={200}
          step={1}
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          placeholder="ex. 10 pour un gâteau"
        />
        <p className="hint">La recette entière fait combien de parts ? Dans Repas, tu noteras ensuite « 1 part ».</p>
      </div>

      <IngredientListEditor ingredients={ingredients} onChange={setIngredients} />

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
