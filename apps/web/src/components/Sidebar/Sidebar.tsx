import type { RulePack } from "@coding-bible/rules";

import styles from "./Sidebar.module.css";

interface SidebarProps {
  counts: Readonly<Record<RulePack, number>>;
  onSelectPack: (pack: RulePack | "all") => void;
  packs: readonly RulePack[];
  selectedPack: RulePack | "all";
  totalCount: number;
}

export const Sidebar = ({
  counts,
  onSelectPack,
  packs,
  selectedPack,
  totalCount,
}: SidebarProps) => {
  return (
    <aside aria-label="Rule sections" className={styles.sidebar}>
      <p className={styles.label}>Sections</p>

      <button
        aria-pressed={selectedPack === "all"}
        className={styles.item}
        data-active={selectedPack === "all"}
        onClick={() => onSelectPack("all")}
        type="button"
      >
        <span>All rules</span>
        <span className={styles.count}>{totalCount}</span>
      </button>

      {packs.map((pack) => (
        <button
          aria-pressed={selectedPack === pack}
          className={styles.item}
          data-active={selectedPack === pack}
          key={pack}
          onClick={() => onSelectPack(pack)}
          type="button"
        >
          <span>{pack}</span>
          <span className={styles.count}>{counts[pack]}</span>
        </button>
      ))}
    </aside>
  );
};
