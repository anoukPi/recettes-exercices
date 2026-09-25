import type { TestIllustration } from '../lib/fitnessTestCatalog';

// Schémas dessinés pour Kaly (aucune image libre trouvée pour ces tests) :
// silhouettes simples aux couleurs de l'app.
const STROKE = { stroke: 'var(--noir)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' };

function Drawing({ drawing }: { drawing: 'suspension' | 'genou-mur' | 'chaise' }) {
  if (drawing === 'suspension') {
    return (
      <svg viewBox="0 0 240 180" role="img" aria-label="Suspension à la barre, bras tendus">
        <line x1="40" y1="22" x2="200" y2="22" stroke="var(--petrole)" strokeWidth="8" strokeLinecap="round" />
        <circle cx="120" cy="62" r="14" fill="var(--corail)" />
        <path d="M100 24 L106 80 M140 24 L134 80" {...STROKE} />
        <path d="M120 78 L120 128 M120 128 L108 172 M120 128 L132 172" {...STROKE} />
      </svg>
    );
  }
  if (drawing === 'genou-mur') {
    return (
      <svg viewBox="0 0 240 180" role="img" aria-label="Fente face au mur, genou touchant le mur, talon au sol">
        <line x1="200" y1="10" x2="200" y2="170" stroke="var(--petrole)" strokeWidth="8" />
        <line x1="20" y1="170" x2="210" y2="170" stroke="var(--petrole)" strokeWidth="4" />
        <circle cx="130" cy="36" r="13" fill="var(--corail)" />
        <path d="M128 50 L118 104" {...STROKE} />
        <path d="M118 104 L196 132 L170 170" {...STROKE} />
        <path d="M118 104 L70 138 L40 168" {...STROKE} />
        <path d="M150 170 L178 170" stroke="var(--corail)" strokeWidth="4" strokeDasharray="4 4" />
        <text x="146" y="162" fontSize="12" fill="var(--text-muted)">cm</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 180" role="img" aria-label="Chaise contre le mur, cuisses parallèles au sol">
      <line x1="40" y1="10" x2="40" y2="170" stroke="var(--petrole)" strokeWidth="8" />
      <line x1="30" y1="170" x2="220" y2="170" stroke="var(--petrole)" strokeWidth="4" />
      <circle cx="62" cy="40" r="14" fill="var(--corail)" />
      <path d="M58 56 L56 110 L118 110 L118 168 L136 168" {...STROKE} />
      <path d="M58 70 L96 92" {...STROKE} />
    </svg>
  );
}

export function TestIllustrationView({ illustration }: { illustration: TestIllustration }) {
  if (illustration.kind === 'drawing') {
    return (
      <figure className="test-illustration drawing">
        <Drawing drawing={illustration.drawing} />
        <figcaption>Schéma Kaly</figcaption>
      </figure>
    );
  }
  return (
    <figure className="test-illustration">
      {illustration.kind === 'image' ? (
        <img src={illustration.src} alt="" loading="lazy" />
      ) : (
        <video src={illustration.src} poster={illustration.poster} controls preload="none" playsInline />
      )}
      <figcaption>
        <a href={illustration.page} target="_blank" rel="noreferrer">
          {illustration.credit}
        </a>{' '}
        — Wikimedia Commons
      </figcaption>
    </figure>
  );
}
