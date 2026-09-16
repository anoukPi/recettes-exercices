import { useEffect, useMemo, useState } from 'react';
import { LibraryView } from '../components/LibraryView';
import { listRecipes } from '../api/recipes';
import { useRecipesNutrition } from '../lib/useRecipesNutrition';
import type { Recipe } from '../types';

function recipeSubtitle(n: { calories: number; proteinPct: number; carbsPct: number; fatPct: number; avgGi: number | null }): string {
  const parts = [`${Math.round(n.calories)} kcal`, `${n.proteinPct}% P`, `${n.carbsPct}% G`, `${n.fatPct}% L`];
  if (n.avgGi !== null) parts.push(`IG ${Math.round(n.avgGi)}`);
  return parts.join(' · ');
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

  const { byId: nutritionById } = useRecipesNutrition(recipes);

  const items = useMemo(
    () =>
      recipes.map((r) => ({
        ...r,
        subtitle: nutritionById[r.id] ? recipeSubtitle(nutritionById[r.id]) : null,
      })),
    [recipes, nutritionById],
  );

  return (
    <LibraryView
      title="Recettes"
      items={items}
      loading={loading}
      error={error}
      newPath="/recipes/new"
      newLabel="+ Ajouter une recette"
      detailPath={(id) => `/recipes/${id}`}
    />
  );
}
