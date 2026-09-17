import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteRecipe, listRecipes } from '../api/recipes';
import { useSession } from '../lib/auth';
import type { Recipe } from '../types';

/** Liste toutes les recettes (pool partagé) pour pouvoir supprimer celles
 * créées par erreur (doublon, mauvais nom...) sans devoir ouvrir chaque
 * recette une à une. */
export function RecipeManager() {
  const { session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    listRecipes()
      .then(setRecipes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement la recette "${title}" ?`)) return;
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <section className="reference-manager">
      <h3>Recettes</h3>
      {error && <p className="error">{error}</p>}
      {!loading && recipes.length > 8 && (
        <input
          type="search"
          className="reference-filter-input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`Filtrer parmi ${recipes.length}…`}
        />
      )}
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <ul className="reference-item-list">
          {filtered.length === 0 && <li className="reference-empty">Aucun résultat.</li>}
          {filtered.map((recipe) => (
            <li key={recipe.id}>
              <span>
                <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
              </span>
              {session?.user.id === recipe.user_id && (
                <button
                  type="button"
                  className="remove-row"
                  onClick={() => handleDelete(recipe.id, recipe.title)}
                  aria-label={`Supprimer ${recipe.title}`}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
