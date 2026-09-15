import { ReferenceItemManager } from '../components/ReferenceItemManager';
import { ProfileSection } from '../components/ProfileSection';
import { AuthStatus } from '../components/AuthStatus';

export function SettingsPage() {
  return (
    <section>
      <h2>Paramètres</h2>
      <AuthStatus />
      <ProfileSection />
      <p className="hint">
        Gère les listes de mesures et d'ingrédients proposées dans le formulaire de recette.
      </p>
      <ReferenceItemManager type="unit" title="Mesures" />
      <ReferenceItemManager type="ingredient" title="Ingrédients" />
    </section>
  );
}
