import { rulePacks, rules } from "@coding-bible/rules";
import type { RulePack } from "@coding-bible/rules";
import { useState } from "react";

import { RuleCard } from "./components/RuleCard/RuleCard";
import { RuleSearch } from "./components/RuleSearch/RuleSearch";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { countRulesByPack, filterRules } from "./utils/rules";
import styles from "./App.module.css";

const ruleCounts = countRulesByPack(rules, rulePacks);

export const App = () => {
  const [query, setQuery] = useState("");
  const [selectedPack, setSelectedPack] = useState<RulePack | "all">("all");

  const visibleRules = filterRules(rules, query, selectedPack);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>CODING BIBLE</p>
        <h1>Engineering standards for software that lasts.</h1>
        <p className={styles.intro}>
          Strict enough to guide decisions. Explicit enough to explain why.
          Structured enough for humans, tooling, and AI agents.
        </p>

        <RuleSearch onChange={setQuery} value={query} />
      </header>

      <div className={styles.layout}>
        <Sidebar
          counts={ruleCounts}
          onSelectPack={setSelectedPack}
          packs={rulePacks}
          selectedPack={selectedPack}
          totalCount={rules.length}
        />

        <section aria-label="Rules">
          <p aria-live="polite" className={styles.results}>
            {visibleRules.length} {visibleRules.length === 1 ? "rule" : "rules"}
          </p>

          {visibleRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}

          {!visibleRules.length ? (
            <p className={styles.empty}>
              No rules match this search and section.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
};
