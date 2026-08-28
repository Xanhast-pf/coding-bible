import type { RulePack } from "@coding-bible/rules";

import styles from "./Sidebar.module.css";

interface SidebarProps {
  onSelectPack: (pack: RulePack | "all") => void;
  packs: readonly RulePack[];
  selectedPack: RulePack | "all";
}

export const Sidebar = ({
  onSelectPack,
  packs,
  selectedPack,
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
        All rules
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
          {pack}
        </button>
      ))}
    </aside>
  );
};
