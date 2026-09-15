import { useState, type FormEvent } from 'react';
import { setManualNutrition } from '../api/nutrition';

interface ManualNutritionFormProps {
  referenceItemId: string;
  label: string;
  onSaved: () => void;
}

const FIELDS: { key: 'calories_kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g' | 'sugar_g' | 'sodium_mg'; label: string; unit: string }[] = [
  { key: 'calories_kcal', label: 'Calories', unit: 'kcal' },
  { key: 'protein_g', label: 'Protéines', unit: 'g' },
  { key: 'carbs_g', label: 'Glucides', unit: 'g' },
  { key: 'fat_g', label: 'Lipides', unit: 'g' },
  { key: 'fiber_g', label: 'Fibres', unit: 'g' },
  { key: 'sugar_g', label: 'Sucres', unit: 'g' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
];

export function ManualNutritionForm({ referenceItemId, label, onSaved }: ManualNutritionFormProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.calories_kcal) {
      setError('Les calories (pour 100g) sont au minimum nécessaires.');
      return;
    }
    setSaving(true);
    try {
      const parsed: Record<string, number> = {};
      for (const { key } of FIELDS) {
        if (values[key]) parsed[key] = parseFloat(values[key].replace(',', '.'));
      }
      await setManualNutrition(referenceItemId, parsed);
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="link-button manual-nutrition-toggle" onClick={() => setOpen(true)}>
        Renseigner les valeurs manuellement
      </button>
    );
  }

  return (
    <form className="manual-nutrition-form" onSubmit={handleSubmit}>
      <p className="hint">
        Valeurs pour 100g de « {label} » — demande-les à une IA ou trouve-les toi-même, puis
        recopie-les ici. Marquées comme saisie manuelle, pas vérifiées comme les données USDA.
      </p>
      {error && <p className="error">{error}</p>}
      <div className="manual-nutrition-grid">
        {FIELDS.map(({ key, label: fieldLabel, unit }) => (
          <div className="field" key={key}>
            <label htmlFor={`manual-${key}`}>
              {fieldLabel} ({unit})
            </label>
            <input
              id={`manual-${key}`}
              type="number"
              step="any"
              value={values[key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="manual-nutrition-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="link-button" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}
