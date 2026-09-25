import { useState } from 'react';
import { RECIPE_CATEGORY_EMOJI, type Recipe } from '../types';

// Fond de la vignette (quand il n'y a ni photo ni image IA) : une teinte de
// la palette par catégorie, pour que la liste reste colorée et lisible.
const TILE_BY_CATEGORY: Record<string, string> = {
  Pain: 'tile-beige',
  'Banana bread': 'tile-beige',
  Gâteau: 'tile-corail',
  Cookie: 'tile-corail',
  Dessert: 'tile-corail',
  Viande: 'tile-petrole',
  Poisson: 'tile-petrole',
  Entrée: 'tile-eau',
  Plat: 'tile-petrole',
  Salade: 'tile-eau',
  'Petit-déjeuner': 'tile-beige',
  Sauce: 'tile-eau',
  Boisson: 'tile-eau',
};

/** Photo de la recette ; sinon l'image générée par IA ; sinon une vignette
 * illustrée (emoji de la catégorie). Une image qui ne charge pas retombe sur
 * la vignette. */
export function RecipeImage({ recipe, className = '' }: { recipe: Recipe; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = recipe.photo_url ?? recipe.ai_image_url;
  const emoji = (recipe.category && RECIPE_CATEGORY_EMOJI[recipe.category]) || '🍽️';

  if (src && !failed) {
    return (
      <div className={`recipe-image ${className}`}>
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
        {!recipe.photo_url && <span className="recipe-image-badge">✨ Image IA</span>}
      </div>
    );
  }
  return (
    <div className={`recipe-image recipe-image-tile ${TILE_BY_CATEGORY[recipe.category ?? ''] ?? 'tile-eau'} ${className}`}>
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}
