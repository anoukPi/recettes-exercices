import { useState, type FormEvent } from 'react';
import { signInWithPassword, signUpWithPassword } from '../lib/auth';
import { translateAuthError } from '../lib/authErrors';

const FEATURES = [
  {
    emoji: '🍽️',
    title: 'Tu notes, Kaly calcule',
    text: 'Calories, protéines, glucides, lipides, oméga, IG : fini les calculs de tête, même pour tes propres recettes.',
    className: 'b-petrole',
  },
  {
    emoji: '🎯',
    title: 'Des objectifs faits pour toi',
    text: 'Selon ton profil, ton objectif et ton activité du jour — ce qu’il te reste à manger, en un coup d’œil.',
    className: 'b-eau',
  },
  {
    emoji: '🏃',
    title: 'Ton sport et tes progrès',
    text: 'Séances, dépense estimée, tests mensuels faciles à faire à la maison, et les courbes qui montrent tes progrès.',
    className: 'b-corail',
  },
  {
    emoji: '👨‍👩‍👧',
    title: 'Toute la famille',
    text: 'Des profils pour tes enfants (avec des repères adaptés à leur croissance, sans calories) ou ton conjoint.',
    className: 'b-blanc',
  },
];

/** Premier écran quand on n'est pas connectée : ce qu'est Kaly + inscription
 * ou connexion directement ici. */
export function WelcomeScreen() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signup') await signUpWithPassword(email.trim(), password);
      else await signInWithPassword(email.trim(), password);
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="welcome">
      <header className="welcome-hero">
        <p className="app-logo">
          Kaly<span>.</span>
        </p>
        <h1>Ta coach nutrition et sport, dans la poche.</h1>
        <p className="welcome-lead">
          Note ce que tu manges et ce que tu fais : Kaly calcule tout, te montre où tu en es et t’aide à progresser —
          sans prise de tête.
        </p>
        <a className="welcome-cta" href="#inscription">
          Commencer gratuitement
        </a>
      </header>

      <div className="welcome-features">
        {FEATURES.map((f) => (
          <div key={f.title} className={`block ${f.className} welcome-feature`}>
            <span className="welcome-feature-emoji" aria-hidden="true">
              {f.emoji}
            </span>
            <h2>{f.title}</h2>
            <p>{f.text}</p>
          </div>
        ))}
      </div>

      <section className="block b-blanc welcome-auth" id="inscription">
        <div className="welcome-auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={mode === 'signup' ? 'selected' : ''}
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
          >
            Créer mon compte
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'selected' : ''}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            J’ai déjà un compte
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="error">{error}</p>}
          <div className="field">
            <label htmlFor="welcome-email">Email</label>
            <input
              id="welcome-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="welcome-password">Mot de passe {mode === 'signup' && '(6 caractères minimum)'}</label>
            <input
              id="welcome-password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? '…' : mode === 'signup' ? 'Créer mon compte' : 'Me connecter'}
          </button>
        </form>
        <ul className="welcome-fine-print">
          <li>🔒 Tes repas, activités, mesures et ton cycle sont privés : personne d’autre ne les voit.</li>
          <li>📚 Les recettes et exercices de la bibliothèque sont partagés entre utilisatrices — pratique pour s’inspirer.</li>
          <li>⚕️ Kaly est un outil de suivi, pas un avis médical : en cas de doute, parles-en à un professionnel de santé.</li>
        </ul>
      </section>
    </div>
  );
}
