import { useState } from 'react';
import { closeMyAccount, exportMyData } from '../api/account';

/** Export et fermeture du compte — volontairement discrets (liens en bas de
 * « Mon compte »), la fermeture demandant une confirmation explicite. Fermer
 * n'efface rien : le compte est désactivé et ses données archivées. */
export function AccountDataSection() {
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kaly-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'export a échoué.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await closeMyAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La fermeture a échoué.');
      setDeleting(false);
    }
  };

  return (
    <div className="account-data">
      {error && <p className="error">{error}</p>}
      <div className="account-data-links">
        <button type="button" className="link-button" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Préparation…' : 'Télécharger mes données'}
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" className="link-button" onClick={() => setConfirmOpen(true)}>
          Fermer mon compte
        </button>
      </div>

      {confirmOpen && (
        <div className="sheet-backdrop" onClick={() => !deleting && setConfirmOpen(false)}>
          <div
            className="sheet account-delete-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="account-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="account-delete-title">Es-tu sûre de vouloir fermer ton compte ?</h3>
            <p>
              Tu ne pourras plus te connecter. Rien n'est effacé : ton profil, tes carnets (repas,
              activité, eau, cycle), tes tests, tes recettes et tes exercices restent enregistrés et
              archivés.
            </p>
            <p className="hint">
              Pour rouvrir ton compte, récupérer tes données ou demander leur effacement définitif,
              écris à Anouk.
            </p>
            <div className="account-delete-actions">
              <button type="button" className="primary-dark" onClick={() => setConfirmOpen(false)} disabled={deleting}>
                Non, garder mon compte
              </button>
              <button type="button" className="link-button danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Fermeture…' : 'Oui, fermer mon compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
