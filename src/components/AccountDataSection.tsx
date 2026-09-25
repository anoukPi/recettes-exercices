import { useState } from 'react';
import { deleteMyAccount, exportMyData } from '../api/account';

/** Export et suppression du compte — volontairement discrets (liens en bas de
 * « Mon compte »), la suppression demandant une confirmation explicite. */
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
      await deleteMyAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La suppression a échoué.');
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
          Supprimer mon compte
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
            <h3 id="account-delete-title">Es-tu sûre de vouloir supprimer ton compte ?</h3>
            <p>
              C'est définitif : ton profil, tes carnets (repas, activité, eau, cycle) et tes tests
              seront effacés et ne pourront pas être récupérés.
            </p>
            <p className="hint">
              Tes recettes et exercices restent dans le pool partagé, sans ton nom, car d'autres
              peuvent les utiliser. Pense à télécharger tes données avant si tu veux les garder.
            </p>
            <div className="account-delete-actions">
              <button type="button" className="primary-dark" onClick={() => setConfirmOpen(false)} disabled={deleting}>
                Non, garder mon compte
              </button>
              <button type="button" className="link-button danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Suppression…' : 'Oui, supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
