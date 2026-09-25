import { useState } from 'react';
import { ManualNutritionForm } from './ManualNutritionForm';
import { addReferenceItem, setPieceWeight } from '../api/referenceItems';
import type { RecipeIngredientIssue } from '../lib/useRecipeNutrition';

/** Un ingrédient inconnu : on crée si besoin sa fiche (liste des aliments),
 * puis on ouvre le formulaire des valeurs pour 100 g. */
function UnknownIngredient({ issue, onSaved }: { issue: RecipeIngredientIssue; onSaved: () => void }) {
  const [refId, setRefId] = useState<string | null>(issue.referenceItemId);
  const [error, setError] = useState<string | null>(null);

  if (refId) {
    return <ManualNutritionForm referenceItemId={refId} label={issue.ingredient} unit={issue.unit} onSaved={onSaved} defaultOpen />;
  }
  return (
    <>
      {error && <p className="error">{error}</p>}
      <button
        type="button"
        className="recipe-fix-button"
        onClick={async () => {
          try {
            const item = await addReferenceItem('ingredient', issue.ingredient);
            setRefId(item.id);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
          }
        }}
      >
        Renseigner ses valeurs nutritives
      </button>
    </>
  );
}

/** Poids d'une pièce/unité inconnu : un seul champ à remplir. */
function MissingWeight({ issue, onSaved }: { issue: RecipeIngredientIssue; onSaved: () => void }) {
  const [grams, setGrams] = useState('');
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    const g = parseFloat(grams.replace(',', '.'));
    if (!issue.referenceItemId || Number.isNaN(g) || g <= 0) {
      setError('Indique un poids en grammes.');
      return;
    }
    try {
      await setPieceWeight(issue.referenceItemId, g);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };
  return (
    <div className="recipe-fix-weight">
      {error && <p className="error">{error}</p>}
      <label>
        1 {issue.unit} de {issue.ingredient} pèse
        <input type="number" inputMode="decimal" min={0} step="any" value={grams} onChange={(e) => setGrams(e.target.value)} />
        g
      </label>
      <button type="button" className="recipe-fix-button" onClick={save} disabled={!grams}>
        Enregistrer
      </button>
    </div>
  );
}

/** Ingrédients qui manquent au calcul, avec de quoi les compléter tout de suite. */
export function RecipeIngredientFixes({
  issues,
  canEdit,
  onFixed,
  onEditRecipe,
}: {
  issues: RecipeIngredientIssue[];
  canEdit: boolean;
  onFixed: () => void;
  onEditRecipe: () => void;
}) {
  if (issues.length === 0) return null;
  return (
    <div className="recipe-fixes">
      <p className="recipe-fixes-title">
        ⚠️ {issues.length === 1 ? '1 ingrédient n’est' : `${issues.length} ingrédients ne sont`} pas encore compté
        {issues.length > 1 ? 's' : ''} — complète-{issues.length > 1 ? 'les' : 'le'} pour un calcul juste :
      </p>
      <ul>
        {issues.map((issue) => (
          <li key={`${issue.ingredient}-${issue.reason}`}>
            <p>
              <strong>{issue.ingredient}</strong>{' '}
              {issue.reason === 'inconnu' && '— Kaly ne connaît pas ses valeurs nutritives.'}
              {issue.reason === 'poids' && `— on ne sait pas combien pèse 1 ${issue.unit}.`}
              {issue.reason === 'quantite' && '— quantité ou mesure manquante dans la recette.'}
            </p>
            {issue.reason === 'inconnu' && <UnknownIngredient issue={issue} onSaved={onFixed} />}
            {issue.reason === 'poids' && <MissingWeight issue={issue} onSaved={onFixed} />}
            {issue.reason === 'quantite' &&
              (canEdit ? (
                <button type="button" className="recipe-fix-button" onClick={onEditRecipe}>
                  Modifier la recette
                </button>
              ) : (
                <p className="hint">À corriger par l’autrice de la recette.</p>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
