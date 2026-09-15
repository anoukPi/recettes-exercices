import { useEffect, useState, type FormEvent } from 'react';
import {
  addReferenceItem,
  deleteReferenceItem,
  listReferenceItems,
  renameReferenceItem,
  type ReferenceItem,
  type ReferenceType,
} from '../api/referenceItems';

interface ReferenceItemManagerProps {
  type: ReferenceType;
  title: string;
}

export function ReferenceItemManager({ type, title }: ReferenceItemManagerProps) {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    listReferenceItems(type)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [type]);

  const sortItems = (list: ReferenceItem[]) =>
    [...list].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      const item = await addReferenceItem(type, trimmed);
      setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : sortItems([...prev, item])));
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const startEdit = (item: ReferenceItem) => {
    setEditingId(item.id);
    setEditingValue(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const saveEdit = async (id: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;
    try {
      const updated = await renameReferenceItem(id, trimmed);
      setItems((prev) => sortItems(prev.map((i) => (i.id === id ? updated : i))));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet élément de la liste ?')) return;
    try {
      await deleteReferenceItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <section className="reference-manager">
      <h3>{title}</h3>
      {error && <p className="error">{error}</p>}
      {!loading && items.length > 8 && (
        <input
          type="search"
          className="reference-filter-input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`Filtrer parmi ${items.length}…`}
        />
      )}
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <ul className="reference-item-list">
          {filteredItems.length === 0 && <li className="reference-empty">Aucun résultat.</li>}
          {filteredItems.map((item) => (
            <li key={item.id}>
              {editingId === item.id ? (
                <>
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    autoFocus
                  />
                  <button type="button" onClick={() => saveEdit(item.id)}>
                    Enregistrer
                  </button>
                  <button type="button" className="link-button" onClick={cancelEdit}>
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <span>{item.name}</span>
                  <button type="button" className="link-button" onClick={() => startEdit(item)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="remove-row"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Supprimer ${item.name}`}
                  >
                    ✕
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form className="reference-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={type === 'unit' ? 'Ajouter une mesure…' : 'Ajouter un ingrédient…'}
        />
        <button type="submit">Ajouter</button>
      </form>
    </section>
  );
}
