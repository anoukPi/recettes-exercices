import { useMemo, useState, type ChangeEvent } from 'react';
import { findClosestMatch } from '../lib/similarity';

interface SearchableSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  onAddNew?: (value: string) => void;
  allowNew?: boolean;
  maxResults?: number;
}

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  onAddNew,
  allowNew = true,
  maxResults = 8,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const trimmedValue = value.trim();

  const filtered = useMemo(() => {
    const query = trimmedValue.toLowerCase();
    const list = !query ? options : options.filter((o) => o.toLowerCase().includes(query));
    return list.slice(0, maxResults);
  }, [options, trimmedValue, maxResults]);

  const exactMatch = useMemo(
    () => options.some((o) => o.toLowerCase() === trimmedValue.toLowerCase()),
    [options, trimmedValue],
  );
  const showAddNew = allowNew && trimmedValue !== '' && !exactMatch;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setOpen(true);
    setSuggestion(null);
    setConfirmed(false);
  };

  const handleFocus = () => {
    setOpen(true);
    setSuggestion(null);
  };

  const selectOption = (option: string) => {
    onChange(option);
    setOpen(false);
    setSuggestion(null);
    setConfirmed(true);
  };

  const handleAddNew = () => {
    onChange(trimmedValue);
    setOpen(false);
    setSuggestion(null);
    setConfirmed(true);
    onAddNew?.(trimmedValue);
  };

  const handleBlur = () => {
    setOpen(false);
    if (!confirmed) {
      setSuggestion(findClosestMatch(value, options));
    }
  };

  const acceptSuggestion = () => {
    if (suggestion) onChange(suggestion);
    setSuggestion(null);
    setConfirmed(true);
  };

  const dismissSuggestion = () => {
    setSuggestion(null);
    setConfirmed(true);
    onAddNew?.(trimmedValue);
  };

  return (
    <div className="searchable-select">
      <div className="searchable-select-input">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {open && (filtered.length > 0 || showAddNew) && (
        <ul className="searchable-select-options">
          {filtered.map((option) => (
            <li key={option}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectOption(option)}>
                {option}
              </button>
            </li>
          ))}
          {showAddNew && (
            <li className="add-new-option">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleAddNew}>
                + Ajouter « {trimmedValue} »
              </button>
            </li>
          )}
        </ul>
      )}
      {suggestion && (
        <div className="searchable-select-suggestion">
          <span>
            « {value} » n'est pas dans la liste. Vouliez-vous dire « {suggestion} » ?
          </span>
          <div className="searchable-select-suggestion-actions">
            <button type="button" onClick={acceptSuggestion}>
              Utiliser « {suggestion} »
            </button>
            <button type="button" className="link-button" onClick={dismissSuggestion}>
              Non, garder « {value} »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
