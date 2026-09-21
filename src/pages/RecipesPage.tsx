import { useEffect, useMemo, useState } from 'react';
import { LibraryView } from '../components/LibraryView';
import { listRecipes, getFavoriteRecipeIds } from '../api/recipes';
import { listMyEndorsedRecipeIds } from '../api/endorsements';
import { useSession } from '../lib/auth';
import { useRecipesNutrition } from '../lib/useRecipesNutrition';
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_EMOJI, type Recipe } from '../types';

function recipeSubtitle(
  recipe: Recipe,
  isTested: boolean,
  isFavorite: boolean,
  n: { calories: number; proteinPct: number; carbsPct: number; fatPct: number; avgGi: number | null } | undefined,
): string {
  const badges: string[] = [];
  if (recipe.category) badges.push(`${RECIPE_CATEGORY_EMOJI[recipe.category] ?? '📦'} ${recipe.category}`);
  if (isTested) badges.push('✅ Testée');
  if (isFavorite) badges.push('⭐ Favorite');
  const nutritionParts = n
    ? [`${Math.round(n.calories)} kcal`, `${n.proteinPct}% P`, `${n.carbsPct}% G`, `${n.fatPct}% L`]
    : [];
  if (n?.avgGi !== null && n?.avgGi !== undefined) nutritionParts.push(`IG ${Math.round(n.avgGi)}`);
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

  const { byId: nutritionById } = useRecipesNutrition(recipes);

  const usedCategories = useMemo(() => {
    const set = new Set(recipes.map((r) => r.category).filter((c): c is string => !!c));
    return RECIPE_CATEGORIES.filter((c) => set.has(c));
  }, [recipes]);

  const filteredByCategory = useMemo(
    () =>
      recipes.filter((r) => {
        if (categoryFilter && r.category !== categoryFilter) return false;
        if (testedOnly && !testedIds.has(r.id)) return false;
        if (favoritesOnly && !favoriteIds.has(r.id)) return false;
        return true;
      }),
    [recipes, categoryFilter, testedOnly, favoritesOnly, favoriteIds, testedIds],
  );

  const items = useMemo(
    () =>
      filteredByCategory.map((r) => ({
        ...r,
        subtitle: recipeSubtitle(r, testedIds.has(r.id), favoriteIds.has(r.id), nutritionById[r.id]),
      })),
    [filteredByCategory, nutritionById, favoriteIds, testedIds],
  );

  return (
    <>
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

      <LibraryView
        title="Recettes"
        items={items}
        loading={loading}
        error={error}
        newPath="/recipes/new"
        newLabel="+ Ajouter une recette"
        detailPath={(id) => `/recipes/${id}`}
      />
    </>
  );
}
