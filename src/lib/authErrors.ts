// Messages de connexion/inscription renvoyés en anglais par Supabase →
// français clair. Un message inconnu est gardé tel quel.
const TRANSLATIONS: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email ou mot de passe incorrect.'],
  [/user already registered|already been registered/i, 'Un compte existe déjà avec cet email — connecte-toi.'],
  [/password should be at least (\d+)/i, 'Le mot de passe doit faire au moins $1 caractères.'],
  [/unable to validate email address|invalid format|email address .* is invalid/i, 'Cet email ne semble pas valide.'],
  [/email not confirmed/i, 'Email pas encore confirmé — regarde dans ta boîte mail.'],
  [/rate limit|too many requests|for security purposes/i, 'Trop d’essais d’affilée — réessaie dans une minute.'],
  [/user is banned|banned/i, 'Ce compte a été fermé. Écris à Anouk pour le réactiver.'],
  [/failed to fetch|network/i, 'Pas de connexion internet ? Réessaie dans un instant.'],
];

export function translateAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? '');
  for (const [pattern, fr] of TRANSLATIONS) {
    const m = message.match(pattern);
    if (m) return fr.replace('$1', m[1] ?? '');
  }
  return message || 'Une erreur est survenue.';
}
