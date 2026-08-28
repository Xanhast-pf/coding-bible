import { useEffect, useRef } from "react";

import styles from "./RuleSearch.module.css";

interface RuleSearchProps {
  onChange: (query: string) => void;
  value: string;
}

export const RuleSearch = ({ onChange, value }: RuleSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

      if (!isSearchShortcut) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <label className={styles.search}>
      <span className={styles.label}>Search rules</span>

      <div className={styles.field}>
        <input
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by rule, concept, code, or ID…"
          ref={inputRef}
          type="search"
          value={value}
        />

        <kbd className={styles.shortcut}>Ctrl/⌘ K</kbd>
      </div>
    </label>
  );
};
