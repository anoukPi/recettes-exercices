// Icônes de navigation, en trait (stroke = currentColor) pour suivre la
// couleur de l'état actif/inactif. Dessinées à la main, sans dépendance.
export type NavIconName =
  | 'carnet'
  | 'repas'
  | 'activite'
  | 'entrainement'
  | 'recettes'
  | 'comparer'
  | 'bilan'
  | 'cycle'
  | 'tests'
  | 'parametres'
  | 'plus'
  | 'add';

const PATHS: Record<NavIconName, string> = {
  carnet: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h11M9 8h6',
  repas: 'M7 3v7a2 2 0 0 0 4 0V3M9 3v18M17 3c-1.7 0-3 2.2-3 5s1.3 4 3 4v9',
  activite: 'M3 12h4l3-7 4 14 3-7h4',
  entrainement: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11',
  recettes: 'M4 19V8l8-4 8 4v11M4 19h16M9 19v-5h6v5',
  comparer: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  bilan: 'M4 18l5-6 4 3 7-9M16 6h4v4',
  cycle: 'M12 3a9 9 0 1 0 9 9M12 3a9 9 0 0 1 9 9M12 3v4M21 12h-4',
  tests: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3',
  parametres:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-2.2-1.3L14.4 3h-4l-.4 2.4a7.3 7.3 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1c.7.6 1.4 1 2.2 1.3l.4 2.4h4l.4-2.4c.8-.3 1.5-.7 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
  plus: 'M5 12h.01M12 12h.01M19 12h.01',
  add: 'M12 5v14M5 12h14',
};

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'plus' ? 3.2 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
