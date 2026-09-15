import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RecipeForm } from '../components/RecipeForm';
import { deleteRecipe, duplicateRecipe, getRecipe, updateRecipe } from '../api/recipes';
import { useSession } from '../lib/auth';
import type { Recipe, RecipeInput } from '../types';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getRecipe(id)
      .then(setRecipe)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [id]);

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
      <h2>{recipe.title}</h2>

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
