import {
  buildRuleSetAgentPrompt,
  ruleLevels,
  rulePacks,
  rules,
} from "@coding-bible/rules";

import { AnalyzeView } from "./components/AnalyzeView/AnalyzeView";
import { AppNavigation } from "./components/AppNavigation/AppNavigation";
import { CopyButton } from "./components/CopyButton/CopyButton";
import { LevelFilter } from "./components/LevelFilter/LevelFilter";
import { RuleCard } from "./components/RuleCard/RuleCard";
import { RuleSearch } from "./components/RuleSearch/RuleSearch";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { useRuleBrowserState } from "./hooks/useRuleBrowserState";
import { createCanonicalBibleUrl } from "./utils/canonicalUrls";
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

  const visibleRules = filterRules(rules, query, selectedPack, selectedLevel);
  const canonicalBibleUrl = createCanonicalBibleUrl(window.location.href);
  return (
    <>
      <header className={styles.hero}>
        <AppNavigation activeView="learn" />
        <p className={styles.eyebrow}>CODING BIBLE</p>
        <h1>A shared engineering standard for humans and AI agents.</h1>
        <p className={styles.intro}>
          Structured rules. Defensible automated review. Focused context for
          code review and remediation.
        </p>

        <div className={styles.boundaryNote}>
          <strong>Coding Bible does not replace your toolchain.</strong>
          <span>
            Prettier formats. ESLint lints. TypeScript type-checks. Tests verify
            behavior. Coding Bible codifies the engineering standards humans and
            AI agents should apply consistently.
          </span>
        </div>

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
          <div className={styles.resultsRow}>
            <p aria-live="polite" className={styles.results}>
              {visibleRules.length}{" "}
              {visibleRules.length === 1 ? "rule" : "rules"}
            </p>

            {visibleRules.length ? (
              <CopyButton
                accessibleLabel={`Copy AI prompt for ${visibleRules.length} visible ${
                  visibleRules.length === 1 ? "rule" : "rules"
                }`}
                label="tldr;"
                value={() =>
                  buildRuleSetAgentPrompt(visibleRules, canonicalBibleUrl)
                }
                variant="accent"
              />
            ) : null}
          </div>

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
      <h1>Automate what we can prove. Review what still needs judgment.</h1>
      <p className={styles.intro}>
        Coding Bible automates only the rules static analysis can defend with
        useful confidence. It complements ESLint, Prettier, TypeScript, tests,
        and human or AI review instead of duplicating them.
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
