import {
  rulePackGroups,
  rulePackLabels,
} from "@coding-bible/rules";
import type { RulePack } from "@coding-bible/rules";

import styles from "./Sidebar.module.css";

interface SidebarProps {
  counts: Readonly<Record<RulePack, number>>;
  onSelectPack: (pack: RulePack | "all") => void;
  packs: readonly RulePack[];
  selectedPack: RulePack | "all";
  totalCount: number;
}

const groupLabels = {
  ecosystem: "Ecosystem",
  foundation: "Foundations",
  quality: "Quality",
} as const;

const groupOrder = ["foundation", "quality", "ecosystem"] as const;

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

      {groupOrder.map((group) => {
        const groupPacks = packs.filter(
          (pack) => rulePackGroups[pack] === group,
        );

        return (
          <div className={styles.group} key={group}>
            <p className={styles.groupLabel}>{groupLabels[group]}</p>

            {groupPacks.map((pack) => (
              <button
                aria-pressed={selectedPack === pack}
                className={styles.item}
                data-active={selectedPack === pack}
                key={pack}
                onClick={() => onSelectPack(pack)}
                type="button"
              >
                <span>{rulePackLabels[pack]}</span>
                <span className={styles.count}>{counts[pack]}</span>
              </button>
            ))}
          </div>
        );
      })}
    </aside>
  );
};
