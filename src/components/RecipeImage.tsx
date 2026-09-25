import { useState } from 'react';
import { RECIPE_CATEGORY_EMOJI, type Recipe } from '../types';
import type { DominantMacro } from '../lib/macros';

// Fond de la vignette (ni photo ni image IA) : la couleur du macronutriment
// le plus représenté, comme dans la barre P/G/L des cartes.
const TILE_BY_MACRO: Record<DominantMacro, string> = {
  proteines: 'tile-petrole',
  glucides: 'tile-eau',
  lipides: 'tile-corail',
};

/** Photo de la recette ; sinon l'image générée par IA ; sinon une vignette
 * illustrée (emoji de la catégorie, fond = macro dominant). Une image qui ne
 * charge pas retombe sur la vignette. */
export function RecipeImage({
  recipe,
  dominant = null,
  className = '',
}: {
  recipe: Recipe;
  dominant?: DominantMacro | null;
  className?: string;
}) {
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
    <div className={`recipe-image recipe-image-tile ${dominant ? TILE_BY_MACRO[dominant] : 'tile-beige'} ${className}`}>
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}
