import { useEffect, useState } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { addReferenceItem, listReferenceItems } from '../api/referenceItems';
import type { RecipeIngredient } from '../types';

interface IngredientListEditorProps {
  ingredients: RecipeIngredient[];
  onChange: (ingredients: RecipeIngredient[]) => void;
}

export function IngredientListEditor({ ingredients, onChange }: IngredientListEditorProps) {
  const [units, setUnits] = useState<string[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<string[]>([]);

  useEffect(() => {
    listReferenceItems('unit')
      .then((items) => setUnits(items.map((i) => i.name)))
      .catch(() => {});
    listReferenceItems('ingredient')
      .then((items) => setIngredientOptions(items.map((i) => i.name)))
      .catch(() => {});
  }, []);

  const addUnitOption = (name: string) => {
    if (!name) return;
    setUnits((prev) => (prev.includes(name) ? prev : [...prev, name]));
    addReferenceItem('unit', name).catch(() => {});
  };

  const addIngredientOption = (name: string) => {
    if (!name) return;
    setIngredientOptions((prev) => (prev.includes(name) ? prev : [...prev, name]));
    addReferenceItem('ingredient', name).catch(() => {});
  };

  const updateRow = (index: number, patch: Partial<RecipeIngredient>) => {
    onChange(ingredients.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...ingredients, { quantity: '', unit: '', ingredient: '' }]);
  };

  return (
    <div className="field">
      <label>Ingrédients</label>
      <div className="ingredient-rows">
        {ingredients.map((row, index) => (
          <div className="ingredient-row" key={index}>
            <input
              type="text"
              className="ingredient-qty"
              value={row.quantity}
              onChange={(e) => updateRow(index, { quantity: e.target.value })}
              placeholder="Nb"
              aria-label="Quantité"
            />
            <SearchableSelect
              id={`unit-${index}`}
              value={row.unit}
              onChange={(v) => updateRow(index, { unit: v })}
              options={units}
              placeholder="Mesure"
              onAddNew={addUnitOption}
              maxResults={40}
            />
            <SearchableSelect
              id={`ingredient-${index}`}
              value={row.ingredient}
              onChange={(v) => updateRow(index, { ingredient: v })}
              options={ingredientOptions}
              placeholder="Ingrédient"
              onAddNew={addIngredientOption}
            />
            <button
              type="button"
              className="remove-row"
              onClick={() => removeRow(index)}
              aria-label="Supprimer cet ingrédient"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="add-row" onClick={addRow}>
        + Ajouter un ingrédient
      </button>
    </div>
  );
}
