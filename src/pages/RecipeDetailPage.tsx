import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RecipeForm } from '../components/RecipeForm';
import { deleteRecipe, duplicateRecipe, getRecipe, updateRecipe } from '../api/recipes';
import {
  endorseRecipe,
  listEndorsementCounts,
  listMyEndorsedRecipeIds,
  removeEndorsement,
} from '../api/endorsements';
import { useSession } from '../lib/auth';
import { useRecipeNutrition } from '../lib/useRecipeNutrition';
import { RECIPE_CATEGORY_EMOJI, type Recipe, type RecipeInput } from '../types';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const { result: nutrition, loading: nutritionLoading } = useRecipeNutrition(recipe);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [endorsed, setEndorsed] = useState(false);
  const [endorsementCount, setEndorsementCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getRecipe(id)
      .then(setRecipe)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !session) return;
    listMyEndorsedRecipeIds().then((ids) => setEndorsed(ids.has(id)));
    listEndorsementCounts().then((counts) => setEndorsementCount(counts[id] ?? 0));
  }, [id, session]);

  const toggleEndorsement = async () => {
    if (!id) return;
    if (endorsed) {
      await removeEndorsement(id);
      setEndorsed(false);
      setEndorsementCount((c) => Math.max(0, c - 1));
    } else {
      await endorseRecipe(id);
      setEndorsed(true);
      setEndorsementCount((c) => c + 1);
    }
  };

  const handleUpdate = async (input: Omit<RecipeInput, 'user_id'>) => {
    if (!id) return;
    const updated = await updateRecipe(id, input);
    setRecipe(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Supprimer définitivement cette recette ?')) return;
    await deleteRecipe(id);
    navigate('/recipes');
  };

  const handleDuplicate = async () => {
    if (!recipe) return;
    const copy = await duplicateRecipe(recipe);
    navigate(`/recipes/${copy.id}`);
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!recipe) return <p className="error">Recette introuvable.</p>;

  if (editing) {
    return (
      <section>
        <h2>Modifier la recette</h2>
        <RecipeForm initial={recipe} onSubmit={handleUpdate} submitLabel="Enregistrer" />
        <button type="button" className="link-button" onClick={() => setEditing(false)}>
          Annuler
        </button>
      </section>
    );
  }

  return (
    <section className="detail">
      <Link to="/recipes" className="back-link">
        ← Recettes
      </Link>
      <h2>
        {recipe.category && <span title={recipe.category}>{RECIPE_CATEGORY_EMOJI[recipe.category] ?? '📦'} </span>}
        {recipe.title}
      </h2>
      {recipe.category && <p className="hint">{recipe.category}</p>}

      {recipe.photo_url && (
        <img src={recipe.photo_url} alt={recipe.title} className="detail-photo" />
      )}

      {recipe.instagram_link && (
        <p>
          <a href={recipe.instagram_link} target="_blank" rel="noreferrer">
            {recipe.instagram_link}
          </a>
        </p>
      )}

      {recipe.tags.length > 0 && (
        <div className="tags">
          {recipe.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <>
          <h3>Ingrédients</h3>
          <ul className="ingredient-list">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{[ing.quantity, ing.unit, ing.ingredient].filter(Boolean).join(' ')}</li>
            ))}
          </ul>
        </>
      )}

      {recipe.ingredients.length > 0 && (
        <div className="summary-card">
          <h4>Valeurs nutritionnelles (recette entière)</h4>
          {nutritionLoading && <p className="hint">Calcul en cours…</p>}
          {!nutritionLoading && nutrition?.anyFound && (
            <>
              <p className="hint">
                {Math.round(nutrition.totals.calories_kcal)} kcal · {Math.round(nutrition.totals.protein_g)} g
                protéines · {Math.round(nutrition.totals.carbs_g)} g glucides · {Math.round(nutrition.totals.fat_g)}{' '}
                g lipides
              </p>
              {nutrition.avgGi !== null && (
                <p className="hint">
                  IG moyen : {Math.round(nutrition.avgGi)} · Charge glycémique :{' '}
                  {Math.round(nutrition.totals.glycemic_load)}
                </p>
              )}
              <details className="journal-micro-details">
                <summary>Micronutriments (recette entière)</summary>
                <ul className="journal-micro-list">
                  <li>
                    <span>Fibres</span>
                    <span>{Math.round(nutrition.totals.fiber_g * 10) / 10} g</span>
                  </li>
                  <li>
                    <span>Sucres</span>
                    <span>{Math.round(nutrition.totals.sugar_g * 10) / 10} g</span>
                  </li>
                  <li>
                    <span>Sel</span>
                    <span>{Math.round(((nutrition.totals.sodium_mg * 2.5) / 1000) * 10) / 10} g</span>
                  </li>
                  <li>
                    <span>dont saturés</span>
                    <span>{Math.round(nutrition.totals.fat_saturated_g * 10) / 10} g</span>
                  </li>
                  <li>
                    <span>Oméga-3</span>
                    <span>{Math.round(nutrition.totals.omega3_g * 10) / 10} g</span>
                  </li>
                  <li>
                    <span>Oméga-6</span>
                    <span>{Math.round(nutrition.totals.omega6_g * 10) / 10} g</span>
                  </li>
                  <li>
                    <span>Oméga-9</span>
                    <span>{Math.round(nutrition.totals.omega9_g * 10) / 10} g</span>
                  </li>
                </ul>
              </details>
              {nutrition.approx && (
                <p className="hint">
                  ≈ Valeurs approximatives — certaines quantités sont en pièces, cuillères ou tasses,
                  converties avec un poids moyen.
                </p>
              )}
              {nutrition.partial && (
                <p className="hint warning-hint">
                  ⚠️ Calcul partiel — certains ingrédients n'ont pas pu être trouvés ou convertis
                  (mesure inconnue, ingrédient introuvable). Le total ci-dessus les exclut.
                </p>
              )}
              <p className="hint">
                Ceci est le total pour la recette telle qu'écrite, pas "par portion" — la recette
                n'a pas de nombre de portions défini.
              </p>
            </>
          )}
          {!nutritionLoading && !nutrition?.anyFound && (
            <p className="hint">
              Aucune valeur calculable — les ingrédients doivent être reconnus (quantité + mesure +
              nom présents dans ta bibliothèque) pour que le calcul fonctionne.
            </p>
          )}
        </div>
      )}

      {recipe.steps && (
        <>
          <h3>Étapes de préparation</h3>
          <p className="preserve-lines">{recipe.steps}</p>
        </>
      )}

      {recipe.notes && (
        <>
          <h3>Notes personnelles</h3>
          <p className="preserve-lines">{recipe.notes}</p>
        </>
      )}

      <p className="meta">
        Ajoutée le {new Date(recipe.created_at).toLocaleDateString('fr-FR')}
      </p>

      {session && (
        <div className="endorsement">
          <button
            type="button"
            className={endorsed ? 'endorsed' : ''}
            onClick={toggleEndorsement}
          >
            {endorsed ? '✓ J\'ai testé' : 'J\'ai testé cette recette'}
          </button>
          {endorsementCount > 0 && (
            <span className="hint">
              {endorsementCount} personne{endorsementCount > 1 ? 's ont' : ' a'} testé cette recette
            </span>
          )}
        </div>
      )}

      <div className="actions">
        {session?.user.id === recipe.user_id ? (
          <>
            <button type="button" onClick={() => setEditing(true)}>
              Modifier
            </button>
            <button type="button" className="danger" onClick={handleDelete}>
              Supprimer
            </button>
          </>
        ) : (
          session && (
            <button type="button" onClick={handleDuplicate}>
              Dupliquer dans ma bibliothèque
            </button>
          )
        )}
      </div>
    </section>
  );
}
