import { useNavigate } from 'react-router-dom';
import { RecipeForm } from '../components/RecipeForm';
import { createRecipe } from '../api/recipes';
import type { RecipeInput } from '../types';

export function NewRecipePage() {
  const navigate = useNavigate();

  const handleSubmit = async (input: RecipeInput) => {
    const recipe = await createRecipe(input);
    navigate(`/recipes/${recipe.id}`);
  };

  return (
    <section>
      <h2>Nouvelle recette</h2>
      <RecipeForm onSubmit={handleSubmit} submitLabel="Ajouter la recette" />
    </section>
  );
}
