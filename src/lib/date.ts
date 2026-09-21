export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return toDateKey(date);
}

/** Nombre de jours entre deux dates (b - a), positif si b est après a. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / msPerDay);
}

export function defaultMealForNow(): 'Petit-déjeuner' | 'Déjeuner' | 'Dîner' | 'Collation' {
  const hour = new Date().getHours();
  if (hour < 11) return 'Petit-déjeuner';
  if (hour < 15) return 'Déjeuner';
  if (hour < 19) return 'Collation';
  return 'Dîner';
}

export function formatDateKeyFr(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Lundi de la semaine contenant cette date. */
export function startOfWeek(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const offset = (date.getDay() + 6) % 7; // lundi = 0
  date.setDate(date.getDate() - offset);
  return toDateKey(date);
}

export function startOfMonth(dateKey: string): string {
  const [year, month] = dateKey.split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function endOfMonth(dateKey: string): string {
  const [year, month] = dateKey.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function formatDateRangeFr(startDate: string, endDate: string): string {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const startLabel = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const endLabel = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}
