import { useState, type FormEvent } from 'react';
import { signInWithPassword, signOut, signUpWithPassword, useSession } from '../lib/auth';

export function AuthStatus() {
  const { session, loading } = useSession();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithPassword(email.trim(), password);
        setInfo('Compte créé et connectée.');
      } else {
        await signInWithPassword(email.trim(), password);
      }
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (session) {
    return (
      <section className="auth-status">
        <h3>Compte</h3>
        <p>Connectée en tant que {session.user.email}</p>
        <button type="button" onClick={() => signOut()}>
          Se déconnecter
        </button>
      </section>
    );
  }

  return (
    <section className="auth-status">
      <h3>Compte</h3>
      <p className="hint">Pas encore de connexion active — ça n'affecte rien pour l'instant.</p>
      {error && <p className="error">{error}</p>}
      {info && <p className="hint">{info}</p>}
      {mode === 'signup' && (
        <p className="hint warning-hint">
          ⚠️ Kaly n'est pas un avis médical — un outil d'auto-suivi, pas un dispositif de santé.
          En cas de doute sur ton alimentation ou ton activité physique, parles-en à un
          professionnel de santé.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="auth-password">Mot de passe</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? '…' : mode === 'signup' ? 'Créer un compte' : 'Se connecter'}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode((m) => (m === 'signup' ? 'login' : 'signup'));
            setError(null);
            setInfo(null);
          }}
        >
          {mode === 'signup' ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? En créer un"}
        </button>
      </form>
    </section>
  );
}
