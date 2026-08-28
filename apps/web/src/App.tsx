import { ruleLevels, rulePacks, rules } from "@coding-bible/rules";

import { AnalyzeView } from "./components/AnalyzeView/AnalyzeView";
import { AppNavigation } from "./components/AppNavigation/AppNavigation";
import { LevelFilter } from "./components/LevelFilter/LevelFilter";
import { RuleCard } from "./components/RuleCard/RuleCard";
import { RuleSearch } from "./components/RuleSearch/RuleSearch";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { useRuleBrowserState } from "./hooks/useRuleBrowserState";
import {
  countRulesByLevel,
  countRulesByPack,
  filterRules,
} from "./utils/rules";
import styles from "./App.module.css";

const levelCounts = countRulesByLevel(rules, ruleLevels);
const ruleCounts = countRulesByPack(rules, rulePacks);

const LearnView = () => {
  const {
    level: selectedLevel,
    pack: selectedPack,
    query,
    setLevel: setSelectedLevel,
    setPack: setSelectedPack,
    setQuery,
  } = useRuleBrowserState();

  const visibleRules = filterRules(
    rules,
    query,
    selectedPack,
    selectedLevel,
  );

  return (
    <>
      <header className={styles.hero}>
        <AppNavigation activeView="learn" />
        <p className={styles.eyebrow}>CODING BIBLE</p>
        <h1>Engineering standards for software that lasts.</h1>
        <p className={styles.intro}>
          Strict enough to guide decisions. Explicit enough to explain why.
          Structured enough for humans, tooling, and AI agents.
        </p>

        <RuleSearch onChange={setQuery} value={query} />

        <LevelFilter
          counts={levelCounts}
          levels={ruleLevels}
          onSelectLevel={setSelectedLevel}
          selectedLevel={selectedLevel}
          totalCount={rules.length}
        />
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
              No rules match the current search and filters.
            </p>
          ) : null}
        </section>
      </div>
    </>
  );
};

const AnalyzerPage = () => (
  <>
    <header className={styles.hero}>
      <AppNavigation activeView="analyze" />
      <p className={styles.eyebrow}>CODING BIBLE · ANALYZER BETA</p>
      <h1>Find the rule. Fix the code.</h1>
      <p className={styles.intro}>
        AST-backed checks for violations we can prove from a snippet—without
        pretending engineering judgment can be reduced to regex.
      </p>
    </header>

    <AnalyzeView />
  </>
);

const readAppView = () =>
  new URLSearchParams(window.location.search).get("view") === "analyze"
    ? "analyze"
    : "learn";

export const App = () => (
  <main className={styles.page}>
    {readAppView() === "analyze" ? <AnalyzerPage /> : <LearnView />}
  </main>
);
