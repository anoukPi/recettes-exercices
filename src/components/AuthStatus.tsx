import { useState, type FormEvent } from 'react';
import { sendMagicLink, signOut, useSession } from '../lib/auth';

export function AuthStatus() {
  const { session, loading } = useSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSending(false);
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
      {sent ? (
        <p className="hint">
          Lien envoyé à {email} — ouvre l'email et clique le lien pour te connecter.
        </p>
      ) : (
        <form onSubmit={handleSend}>
          <p className="hint">Pas encore de connexion active — ça n'affecte rien pour l'instant.</p>
          {error && <p className="error">{error}</p>}
          <div className="field">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              required
            />
          </div>
          <button type="submit" disabled={sending}>
            {sending ? 'Envoi…' : 'Envoyer un lien de connexion'}
          </button>
        </form>
      )}
    </section>
  );
}
