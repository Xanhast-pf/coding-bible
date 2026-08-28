import type { RuleLevel } from "@coding-bible/rules";

import styles from "./LevelFilter.module.css";

interface LevelFilterProps {
  counts: Readonly<Record<RuleLevel, number>>;
  levels: readonly RuleLevel[];
  onSelectLevel: (level: RuleLevel | "all") => void;
  selectedLevel: RuleLevel | "all";
  totalCount: number;
}

export const LevelFilter = ({
  counts,
  levels,
  onSelectLevel,
  selectedLevel,
  totalCount,
}: LevelFilterProps) => {
  return (
    <div aria-label="Rule levels" className={styles.filters} role="group">
      <button
        aria-pressed={selectedLevel === "all"}
        className={styles.filter}
        data-active={selectedLevel === "all"}
        onClick={() => onSelectLevel("all")}
        type="button"
      >
        All <span>{totalCount}</span>
      </button>

      {levels.map((level) => (
        <button
          aria-pressed={selectedLevel === level}
          className={styles.filter}
          data-active={selectedLevel === level}
          data-level={level}
          key={level}
          onClick={() => onSelectLevel(level)}
          type="button"
        >
          {level} <span>{counts[level]}</span>
        </button>
      ))}
    </div>
  );
};
