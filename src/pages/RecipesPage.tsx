import { useEffect, useState } from 'react';
import { LibraryView } from '../components/LibraryView';
import { listRecipes } from '../api/recipes';
import type { Recipe } from '../types';

export function RecipesPage() {
  const [items, setItems] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRecipes()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

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
