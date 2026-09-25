import { useSearchParams } from 'react-router-dom';
import { ReferenceItemManager } from '../components/ReferenceItemManager';
import { RecipeManager } from '../components/RecipeManager';
import { ProfileSection } from '../components/ProfileSection';
import { AuthStatus } from '../components/AuthStatus';

// Sous-menus des Paramètres (demande d'Anouk, 25/09/2026). L'onglet est dans
// l'URL (?onglet=profil) pour pouvoir y renvoyer directement depuis l'app.
const TABS = [
  { value: 'compte', label: 'Mon compte' },
  { value: 'profil', label: 'Profil' },
  { value: 'mesures', label: 'Mesures' },
  { value: 'ingredients', label: 'Ingrédients' },
] as const;
type Tab = (typeof TABS)[number]['value'];

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('onglet');
  const tab: Tab = TABS.some((t) => t.value === requested) ? (requested as Tab) : 'compte';

  return (
    <section className="settings-page">
      <h2>Paramètres</h2>
      <div className="section-tabs settings-tabs" role="tablist" aria-label="Paramètres">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`tag-chip${tab === t.value ? ' selected' : ''}`}
            onClick={() => setSearchParams({ onglet: t.value })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'compte' && <AuthStatus />}
      {tab === 'profil' && <ProfileSection />}
      {tab === 'mesures' && (
        <>
          <p className="hint">Supprime une mesure créée par erreur (typo, doublon…).</p>
          <ReferenceItemManager type="unit" title="Mesures" />
        </>
      )}
      {tab === 'ingredients' && (
        <>
          <p className="hint">
            Supprime un ingrédient ou une recette créés par erreur (typo, doublon…).
          </p>
          <ReferenceItemManager type="ingredient" title="Ingrédients" />
          <RecipeManager />
        </>
      )}
    </section>
  );
}
