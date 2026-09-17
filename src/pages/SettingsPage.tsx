import { ReferenceItemManager } from '../components/ReferenceItemManager';
import { RecipeManager } from '../components/RecipeManager';
import { ProfileSection } from '../components/ProfileSection';
import { AuthStatus } from '../components/AuthStatus';

export function SettingsPage() {
  return (
    <section>
      <h2>Paramètres</h2>
      <AuthStatus />
      <ProfileSection />
      <p className="hint">
        Gère les listes de mesures, d'ingrédients et de recettes — utile pour supprimer un
        ingrédient ou une recette créé par erreur (typo, doublon...).
      </p>
      <ReferenceItemManager type="unit" title="Mesures" />
      <ReferenceItemManager type="ingredient" title="Ingrédients" />
      <RecipeManager />
    </section>
  );
}
