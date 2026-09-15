import { Link, useNavigate } from 'react-router-dom';
import { RecipeForm } from '../components/RecipeForm';
import { createRecipe } from '../api/recipes';
import { useSession } from '../lib/auth';
import type { RecipeInput } from '../types';

export function NewRecipePage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  const handleSubmit = async (input: Omit<RecipeInput, 'user_id'>) => {
    const recipe = await createRecipe(input);
    navigate(`/recipes/${recipe.id}`);
  };

  if (loading) return null;

  if (!session) {
    return (
      <p className="hint">
        Connecte-toi dans <Link to="/settings">Paramètres</Link> pour ajouter une recette.
      </p>
    );
  }

  return (
    <section>
      <h2>Nouvelle recette</h2>
      <RecipeForm onSubmit={handleSubmit} submitLabel="Ajouter la recette" />
    </section>
  );
}
