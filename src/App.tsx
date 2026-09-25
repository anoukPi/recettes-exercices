import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { NavIcon, type NavIconName } from './components/NavIcon';
import { MonthlyTestReminder } from './components/MonthlyTestReminder';
import { ProfileProvider } from './components/ProfileProvider';
import { profileLabel, useProfiles } from './lib/profileContext';
import { createProfile } from './api/profile';
import { ageFromBirthDate } from './lib/dailyNeeds';
import { canTrackCycle } from './lib/cycle';
import type { Profile } from './types';
import { RecipesPage } from './pages/RecipesPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { NewRecipePage } from './pages/NewRecipePage';
import { NewExercisePage } from './pages/NewExercisePage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { JournalPage } from './pages/JournalPage';
import { MealsPage } from './pages/MealsPage';
import { ActivityPage } from './pages/ActivityPage';
import { CyclePage } from './pages/CyclePage';
import { TestsPage } from './pages/TestsPage';
import { BilanPage } from './pages/BilanPage';
import { ComparePage } from './pages/ComparePage';
import { WorkoutSessionsPage } from './pages/WorkoutSessionsPage';
import { NewWorkoutSessionPage } from './pages/NewWorkoutSessionPage';
import { WorkoutSessionDetailPage } from './pages/WorkoutSessionDetailPage';

// Navigation (voir EXPERIENCE.md de l'atelier UX, révisée le 25/09/2026) :
// - mobile : barre du bas noire (Carnet, Bilan, +, Comparer, Plus) ;
// - tablette/ordinateur (≥ 900 px) : menu latéral noir, même logique.
// Règle d'Anouk : ce qui est dans « + » (repas, activité, tests, recettes)
// n'apparaît nulle part ailleurs dans les menus.
interface NavItem {
  path: string;
  label: string;
  icon: NavIconName;
  /** Autres préfixes d'URL qui rendent l'élément actif. */
  alsoActiveOn?: string[];
}

const NAV_CARNET: NavItem = { path: '/journal', label: 'Carnet', icon: 'carnet' };
const NAV_COMPARER: NavItem = { path: '/comparer', label: 'Comparer', icon: 'comparer' };
const NAV_BILAN: NavItem = { path: '/bilan', label: 'Bilan', icon: 'bilan' };
const NAV_CYCLE: NavItem = { path: '/cycle', label: 'Cycle', icon: 'cycle' };
const NAV_PARAMETRES: NavItem = { path: '/settings', label: 'Paramètres', icon: 'parametres' };

const TAB_ITEMS_LEFT = [NAV_CARNET, NAV_BILAN];
const TAB_ITEMS_RIGHT = [NAV_COMPARER];
const SIDEBAR_ITEMS = [NAV_CARNET, NAV_BILAN, NAV_COMPARER, NAV_CYCLE];
// Rangé dans la feuille « Plus » sur mobile.
const MORE_ITEMS = [NAV_CYCLE, NAV_PARAMETRES];

// Le bouton + : seul accès à ces espaces (une couleur = un sens, voir DESIGN.md).
const ADD_ACTIONS = [
  {
    path: '/repas',
    label: 'Repas',
    hint: 'Aliments et recettes du jour',
    className: 'b-petrole',
    activeOn: ['/repas'],
  },
  {
    path: '/activity',
    label: 'Activité',
    hint: 'Séances, exercices, sport',
    className: 'b-corail',
    activeOn: ['/activity', '/sessions', '/exercises'],
  },
  { path: '/tests', label: 'Tests', hint: 'Poids, forme, performances', className: 'b-eau', activeOn: ['/tests'] },
  { path: '/recipes', label: 'Recettes', hint: 'Ta bibliothèque', className: '', activeOn: ['/recipes'] },
];

function isActive(item: NavItem, pathname: string): boolean {
  return [item.path, ...(item.alsoActiveOn ?? [])].some((p) => pathname.startsWith(p));
}

type OpenSheet = 'add' | 'more' | 'profil' | null;

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ProfileAvatar({ profile, accountId }: { profile: Profile | null; accountId: string | null }) {
  const label = profileLabel(profile, accountId);
  return (
    <span className={`profile-avatar${profile && profile.id !== accountId ? ' secondary' : ''}`} aria-hidden="true">
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ProfileSwitcherButton({ onOpen, compact = false }: { onOpen: () => void; compact?: boolean }) {
  const { active, accountId, profiles } = useProfiles();
  if (!accountId) return null;
  return (
    <button
      type="button"
      className={`profile-switcher${compact ? ' compact' : ''}`}
      onClick={onOpen}
      aria-label={`Profil : ${profileLabel(active, accountId)} — changer de profil`}
    >
      <ProfileAvatar profile={active} accountId={accountId} />
      <span className="profile-switcher-name">{profileLabel(active, accountId)}</span>
      <span aria-hidden="true">{profiles.length > 1 ? '⇄' : '▾'}</span>
    </button>
  );
}

function ProfileSheetContent({ onDone }: { onDone: (goToProfile: boolean) => void }) {
  const { profiles, active, accountId, switchTo, reload } = useProfiles();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) {
      setError('Prénom et date de naissance sont nécessaires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createProfile({
        display_name: name.trim(),
        birth_date: birthDate,
        sex: sex === 'homme' || sex === 'femme' ? sex : null,
      });
      await reload();
      switchTo(created.id);
      onDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ul className="profile-list">
        {profiles.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={`profile-option${active?.id === p.id ? ' active' : ''}`}
              onClick={() => {
                switchTo(p.id);
                onDone(false);
              }}
            >
              <ProfileAvatar profile={p} accountId={accountId} />
              <span>
                <strong>{profileLabel(p, accountId)}</strong>
                <small>
                  {p.id === accountId ? 'Profil principal' : 'Profil ajouté'}
                  {p.birth_date ? ` · ${ageFromBirthDate(p.birth_date)} ans` : ''}
                </small>
              </span>
              {active?.id === p.id && <span className="profile-check">✓</span>}
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <form className="profile-add-form" onSubmit={handleCreate}>
          {error && <p className="error">{error}</p>}
          <div className="field">
            <label htmlFor="new-profile-name">Prénom *</label>
            <input
              id="new-profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="new-profile-birth">Date de naissance *</label>
            <input
              id="new-profile-birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="new-profile-sex">Sexe</label>
            <select id="new-profile-sex" value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="">—</option>
              <option value="femme">Fille / femme</option>
              <option value="homme">Garçon / homme</option>
            </select>
          </div>
          <p className="hint">
            Le profil est rattaché à ton compte : ses repas, activités, tests et son bilan sont séparés des tiens. Un
            profil majeur a exactement les mêmes fonctions que toi (objectifs, bilan, cycle…) ; avant 18 ans, Kaly
            affiche des repères pour grandir au lieu d’objectifs de calories — et passe automatiquement en mode adulte
            à ses 18 ans.
          </p>
          <div className="profile-add-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Création…' : 'Créer le profil'}
            </button>
            <button type="button" className="link-button" onClick={() => setAdding(false)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="profile-add-button" onClick={() => setAdding(true)}>
          ＋ Ajouter un profil (enfant, conjoint…)
        </button>
      )}
    </>
  );
}

function AppNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const { active } = useProfiles();
  // Cycle : seulement pour les femmes majeures.
  const cycle = canTrackCycle(active);
  const sidebarItems = SIDEBAR_ITEMS.filter((item) => cycle || item !== NAV_CYCLE);
  const moreItems = MORE_ITEMS.filter((item) => cycle || item !== NAV_CYCLE);

  const go = (path: string) => {
    setOpenSheet(null);
    navigate(path);
  };

  const moreActive = moreItems.some((item) => isActive(item, pathname));
  // Espace du + où l'on se trouve (Repas, Activité…) : le + le signale.
  const addActive = ADD_ACTIONS.find((a) => a.activeOn.some((p) => pathname.startsWith(p)));

  return (
    <>
      <aside className="app-sidebar" aria-label="Navigation principale">
        <p className="app-logo">
          Kaly<span>.</span>
        </p>
        <ProfileSwitcherButton onOpen={() => setOpenSheet('profil')} />
        <button
          type="button"
          className={`sidebar-add${addActive ? ' active' : ''}`}
          onClick={() => setOpenSheet('add')}
        >
          <NavIcon name="add" /> Ajouter
        </button>
        {sidebarItems.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`sidebar-link${isActive(item, pathname) ? ' active' : ''}`}
            onClick={() => go(item.path)}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </button>
        ))}
        <div className="sidebar-spacer" />
        <button
          type="button"
          className={`sidebar-link${isActive(NAV_PARAMETRES, pathname) ? ' active' : ''}`}
          onClick={() => go(NAV_PARAMETRES.path)}
        >
          <NavIcon name={NAV_PARAMETRES.icon} />
          {NAV_PARAMETRES.label}
        </button>
      </aside>

      <header className="app-topbar">
        <p className="app-logo">
          Kaly<span>.</span>
        </p>
        <ProfileSwitcherButton compact onOpen={() => setOpenSheet('profil')} />
      </header>

      <nav className="app-tabbar" aria-label="Navigation principale">
        {TAB_ITEMS_LEFT.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`tab-item${isActive(item, pathname) ? ' active' : ''}`}
            onClick={() => go(item.path)}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className={`tab-add${addActive ? ' active' : ''}`}
          onClick={() => setOpenSheet('add')}
          aria-label={addActive ? `Ajouter — tu es dans ${addActive.label}` : 'Ajouter'}
        >
          <NavIcon name="add" />
        </button>
        {TAB_ITEMS_RIGHT.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`tab-item${isActive(item, pathname) ? ' active' : ''}`}
            onClick={() => go(item.path)}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </button>
        ))}
        <button type="button" className={`tab-item${moreActive ? ' active' : ''}`} onClick={() => setOpenSheet('more')}>
          <NavIcon name="plus" />
          Plus
        </button>
      </nav>

      {openSheet === 'add' && (
        <Sheet title="Ajouter" onClose={() => setOpenSheet(null)}>
          <div className="sheet-grid">
            {ADD_ACTIONS.map((a) => (
              <button
                key={a.path}
                type="button"
                className={`sheet-link ${a.className}${addActive === a ? ' active' : ''}`}
                onClick={() => go(a.path)}
              >
                {a.label}
                <small>{a.hint}</small>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {openSheet === 'profil' && (
        <Sheet title="Profil" onClose={() => setOpenSheet(null)}>
          <ProfileSheetContent
            onDone={(goToProfile) => {
              setOpenSheet(null);
              if (goToProfile) navigate('/settings?onglet=profil');
            }}
          />
        </Sheet>
      )}
      {openSheet === 'more' && (
        <Sheet title="Plus" onClose={() => setOpenSheet(null)}>
          <div className="sheet-grid three">
            {moreItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`sheet-link${isActive(item, pathname) ? ' active' : ''}`}
                onClick={() => go(item.path)}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}

// Remonte en haut de page à chaque changement de page ; descend jusqu'à
// l'ancre (#hydratation…) quand l'URL en contient une.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = hash.slice(1);
    let tries = 0;
    // La section peut n'apparaître qu'après chargement des données.
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 20) {
        window.clearInterval(timer);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <ProfileProvider>
      {(profileKey) => (
        <div className="app">
          <ScrollManager />
          <AppNavigation />
          <MonthlyTestReminder key={`rappel-${profileKey}`} />

          {/* Clé = profil actif : changer de profil recharge chaque page. */}
          <main className="app-main" key={profileKey}>
            <AppRoutes />
          </main>
        </div>
      )}
    </ProfileProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/journal" replace />} />
      <Route path="/recipes" element={<RecipesPage />} />
      <Route path="/recipes/new" element={<NewRecipePage />} />
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      <Route path="/exercises" element={<ExercisesPage />} />
      <Route path="/exercises/new" element={<NewExercisePage />} />
      <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/journal" element={<JournalPage />} />
      <Route path="/repas" element={<MealsPage />} />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="/cycle" element={<CyclePage />} />
      <Route path="/tests" element={<TestsPage />} />
      <Route path="/bilan" element={<BilanPage />} />
      <Route path="/comparer" element={<ComparePage />} />
      <Route path="/entrainement" element={<Navigate to="/activity" replace />} />
      <Route path="/activite" element={<Navigate to="/activity" replace />} />
      <Route path="/sessions" element={<WorkoutSessionsPage />} />
      <Route path="/sessions/new" element={<NewWorkoutSessionPage />} />
      <Route path="/sessions/:id" element={<WorkoutSessionDetailPage />} />
    </Routes>
  );
}

export default App;
