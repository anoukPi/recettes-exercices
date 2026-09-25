import { useEffect, useMemo, useState } from 'react';
import { PageIntro } from '../components/PageIntro';
import { LibraryView } from '../components/LibraryView';
import { RecipeImage } from '../components/RecipeImage';
import { dominantMacro } from '../lib/macros';
import { listRecipes, getFavoriteRecipeIds } from '../api/recipes';
import { listMyEndorsedRecipeIds } from '../api/endorsements';
import { useSession } from '../lib/auth';
import { useRecipesNutrition, type RecipeCardNutrition } from '../lib/useRecipesNutrition';
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_EMOJI, type Recipe } from '../types';

function recipeSubtitle(
  recipe: Recipe,
  isTested: boolean,
  isFavorite: boolean,
  n: RecipeCardNutrition | undefined,
): string {
  const badges: string[] = [];
  if (recipe.category) badges.push(`${RECIPE_CATEGORY_EMOJI[recipe.category] ?? '📦'} ${recipe.category}`);
  if (isTested) badges.push('✅ Testée');
  if (isFavorite) badges.push('⭐ Favorite');
  const nutritionParts = n
    ? [
        `${n.approx ? '≈ ' : ''}${Math.round(n.calories)} kcal`,
        `${n.proteinPct}% P`,
        `${n.carbsPct}% G`,
        `${n.fatPct}% L`,
      ]
    : [];
  if (n?.avgGi !== null && n?.avgGi !== undefined) nutritionParts.push(`IG ${Math.round(n.avgGi)}`);
  // Signal de fiabilité visible dans le pool partagé : une recette mal saisie par
  // une autre ne doit pas fausser silencieusement le bilan de celle qui l'utilise.
  if (n?.partial) nutritionParts.push('⚠️ calcul partiel');
  return [...badges, ...nutritionParts].join(' · ');
}

export function RecipesPage() {
  const { session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [testedIds, setTestedIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [testedOnly, setTestedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  // Bibliothèque partagée : toutes les recettes, ou seulement les miennes.
  const [ownerFilter, setOwnerFilter] = useState<'toutes' | 'miennes'>('toutes');
  const myId = session?.user.id ?? null;

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
    getFavoriteRecipeIds()
      .then((ids) => setFavoriteIds(new Set(ids)))
      .catch(() => setFavoriteIds(new Set()));
  }, []);

  useEffect(() => {
    if (!session) return;
    listMyEndorsedRecipeIds()
      .then(setTestedIds)
      .catch(() => setTestedIds(new Set()));
  }, [session]);

  const { byId: nutritionById, loading: nutritionLoading } = useRecipesNutrition(recipes);

  const usedCategories = useMemo(() => {
    const set = new Set(recipes.map((r) => r.category).filter((c): c is string => !!c));
    return RECIPE_CATEGORIES.filter((c) => set.has(c));
  }, [recipes]);

  const filteredByCategory = useMemo(
    () =>
      recipes.filter((r) => {
        if (ownerFilter === 'miennes' && r.user_id !== myId) return false;
        if (categoryFilter && r.category !== categoryFilter) return false;
        if (testedOnly && !testedIds.has(r.id)) return false;
        if (favoritesOnly && !favoriteIds.has(r.id)) return false;
        return true;
      }),
    [recipes, categoryFilter, testedOnly, favoritesOnly, favoriteIds, testedIds, ownerFilter, myId],
  );

  const items = useMemo(
    () =>
      filteredByCategory.map((r) => ({
        ...r,
        // Titre + tags suffisent à la recherche ; la carte affiche le reste.
        photo_url: null,
        subtitle: recipeSubtitle(r, testedIds.has(r.id), favoriteIds.has(r.id), nutritionById[r.id]),
      })),
    [filteredByCategory, nutritionById, favoriteIds, testedIds],
  );

  const recipesById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  const renderCard = (item: { id: string }) => {
    const r = recipesById.get(item.id);
    if (!r) return null;
    const n = nutritionById[r.id];
    const perPart = n && r.servings ? n.calories / r.servings : null;
    return (
      <>
        <div className="recipe-card-media">
          <RecipeImage recipe={r} dominant={n ? dominantMacro(n.proteinPct, n.carbsPct, n.fatPct) : null} />
          <div className="recipe-card-badges">
            {testedIds.has(r.id) && <span title="Déjà testée">✅</span>}
            {favoriteIds.has(r.id) && <span title="Favorite du mois">⭐</span>}
            {r.user_id === myId && <span title="Ta recette">✨ À moi</span>}
          </div>
          {r.category && (
            <span className="recipe-card-category">
              {RECIPE_CATEGORY_EMOJI[r.category] ?? '📦'} {r.category}
            </span>
          )}
        </div>
        <div className="recipe-card-body">
          <h3>{r.title}</h3>
          {n ? (
            <>
              <p className="recipe-card-kcal">
                {perPart !== null ? (
                  <>
                    <strong>
                      {n.approx ? '≈ ' : ''}
                      {Math.round(perPart)} kcal
                    </strong>{' '}
                    / part · {r.servings} parts
                  </>
                ) : (
                  <>
                    <strong>
                      {n.approx ? '≈ ' : ''}
                      {Math.round(n.calories)} kcal
                    </strong>{' '}
                    la recette
                  </>
                )}
                {n.avgGi !== null && <span className="recipe-card-ig">IG {Math.round(n.avgGi)}</span>}
              </p>
              <div
                className="macro-bar"
                role="img"
                aria-label={`Protéines ${n.proteinPct} %, glucides ${n.carbsPct} %, lipides ${n.fatPct} %`}
              >
                <span className="macro-p" style={{ flex: n.proteinPct || 0.001 }} />
                <span className="macro-g" style={{ flex: n.carbsPct || 0.001 }} />
                <span className="macro-l" style={{ flex: n.fatPct || 0.001 }} />
              </div>
              <p className="recipe-card-macros">
                <span>P {n.proteinPct}%</span>
                <span>G {n.carbsPct}%</span>
                <span>L {n.fatPct}%</span>
                {n.partial && <span title="Certains ingrédients n'ont pas pu être comptés">⚠️ partiel</span>}
              </p>
            </>
          ) : (
            <p className="recipe-card-kcal hint">
              {nutritionLoading ? 'Calcul des calories…' : 'Calories non calculables'}
            </p>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <PageIntro id="recettes" emoji="📚" title="La bibliothèque de recettes">
        <p>
          Les recettes de toutes les utilisatrices, pour s’inspirer : filtre « Les miennes » pour ne voir que les
          tiennes. Calories et macros sont calculées à partir des ingrédients ; indique le{' '}
          <strong>nombre de parts</strong> pour noter ensuite « 1 part » dans tes repas.
        </p>
      </PageIntro>
      <LibraryView
        title="Recettes"
        items={items}
        loading={loading}
        error={error}
        newPath="/recipes/new"
        newLabel="+ Ajouter une recette"
        detailPath={(id) => `/recipes/${id}`}
        renderCard={renderCard}
        toolbar={
          <>
            <div className="recipe-owner-toggle bilan-period-toggle" role="group" aria-label="Recettes affichées">
              {(
                [
                  ['toutes', `Toutes (${recipes.length})`],
                  ['miennes', `Les miennes (${recipes.filter((r) => r.user_id === myId).length})`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={ownerFilter === value}
                  className={ownerFilter === value ? 'selected' : ''}
                  onClick={() => setOwnerFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="recipe-category-filters">
              <div className="field">
                <label htmlFor="recipe-category-filter">Catégorie</label>
                <select
                  id="recipe-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">Toutes les recettes</option>
                  {usedCategories.map((c) => (
                    <option key={c} value={c}>
                      {RECIPE_CATEGORY_EMOJI[c] ?? ''} {c}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className={`tag-chip${testedOnly ? ' selected' : ''}`}
                onClick={() => setTestedOnly((v) => !v)}
              >
                ✅ Déjà testées
              </button>
              <button
                type="button"
                className={`tag-chip${favoritesOnly ? ' selected' : ''}`}
                onClick={() => setFavoritesOnly((v) => !v)}
              >
                ⭐ Favorites (top 5 du mois)
              </button>
            </div>
          </>
        }
        gridClassName="recipe-grid"
      />
    </>
  );
}
