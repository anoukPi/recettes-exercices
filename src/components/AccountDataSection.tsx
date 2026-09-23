import { useState } from 'react';
import { deleteMyAccount, exportMyData } from '../api/account';

const CONFIRM_WORD = 'SUPPRIMER';

export function AccountDataSection() {
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
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
      <h4>Mes données</h4>
      {error && <p className="error">{error}</p>}
      <button type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? 'Préparation…' : 'Télécharger mes données (JSON)'}
      </button>

      {!confirmOpen ? (
        <button type="button" className="link-button danger" onClick={() => setConfirmOpen(true)}>
          Supprimer mon compte
        </button>
      ) : (
        <div className="account-delete-confirm">
          <p className="hint warning-hint">
            Supprime définitivement ton compte, ton profil, tes carnets (repas, activité, eau,
            cycle) et tes tests. Tes recettes et exercices restent dans le pool partagé, sans ton
            nom, car d'autres carnets peuvent les utiliser. Pense à télécharger tes données avant.
          </p>
          <div className="field">
            <label htmlFor="account-delete-confirm">Tape {CONFIRM_WORD} pour confirmer</label>
            <input
              id="account-delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="danger"
            onClick={handleDelete}
            disabled={confirmText.trim() !== CONFIRM_WORD || deleting}
          >
            {deleting ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setConfirmOpen(false);
              setConfirmText('');
            }}
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
