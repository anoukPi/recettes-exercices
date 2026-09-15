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
