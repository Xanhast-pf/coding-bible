import {
  analyzerRuleIds,
  type AnalyzerRuleSelection,
} from "@coding-bible/analyzer";
import {
  rulePackLabels,
  rules,
  type CodingRule,
  type RulePack,
} from "@coding-bible/rules";
import { useMemo, useState } from "react";

import {
  createRuleSelectionFromEnabledIds,
  getEnabledAnalyzerRuleIds,
} from "../../analyzer/ruleSelection";
import styles from "./AnalyzeView.module.css";

const analyzerRuleIdSet = new Set(analyzerRuleIds);
const automatedRules = rules.filter((rule) => analyzerRuleIdSet.has(rule.id));

const groupRules = (items: readonly CodingRule[]) => {
  const groups = new Map<RulePack, CodingRule[]>();
  for (const rule of items) {
    const group = groups.get(rule.pack);
    if (group) {
      group.push(rule);
    } else {
      groups.set(rule.pack, [rule]);
    }
  }
  return [...groups.entries()].sort(([left], [right]) =>
    rulePackLabels[left].localeCompare(rulePackLabels[right]),
  );
};

interface RuleSelectionPanelProps {
  disabled: boolean;
  onChange: (selection: AnalyzerRuleSelection) => void;
  selection: AnalyzerRuleSelection;
}

export const RuleSelectionPanel = ({
  disabled,
  onChange,
  selection,
}: RuleSelectionPanelProps) => {
  const [query, setQuery] = useState("");
  const enabledRuleIds = useMemo(
    () => getEnabledAnalyzerRuleIds(selection),
    [selection],
  );
  const enabled = useMemo(() => new Set(enabledRuleIds), [enabledRuleIds]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleRules = normalizedQuery
    ? automatedRules.filter((rule) =>
        [rule.id, rule.title, rule.summary, rulePackLabels[rule.pack]]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : automatedRules;
  const groups = groupRules(visibleRules);

  const updateEnabled = (nextEnabled: ReadonlySet<string>) => {
    onChange(createRuleSelectionFromEnabledIds([...nextEnabled]));
  };

  const setRuleEnabled = (ruleId: string, nextEnabled: boolean) => {
    const next = new Set(enabled);
    if (nextEnabled) {
      next.add(ruleId);
    } else {
      next.delete(ruleId);
    }
    updateEnabled(next);
  };

  const setPackEnabled = (
    packRules: readonly CodingRule[],
    nextEnabled: boolean,
  ) => {
    const next = new Set(enabled);
    for (const rule of packRules) {
      if (nextEnabled) {
        next.add(rule.id);
      } else {
        next.delete(rule.id);
      }
    }
    updateEnabled(next);
  };

  return (
    <details className={styles.ruleSelectionPanel}>
      <summary>
        <span>
          <strong>Automated rules</strong>
          <small>Saved locally in this browser</small>
        </span>
        <span className={styles.ruleSelectionCount}>
          {enabled.size}/{analyzerRuleIds.length} enabled
        </span>
      </summary>

      <div className={styles.ruleSelectionBody}>
        <div className={styles.ruleSelectionToolbar}>
          <label>
            <span className={styles.visuallyHidden}>
              Filter automated rules
            </span>
            <input
              disabled={disabled}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by rule, title, or pack…"
              type="search"
              value={query}
            />
          </label>
          <div>
            <button
              disabled={disabled || enabled.size === analyzerRuleIds.length}
              onClick={() => onChange({})}
              type="button"
            >
              Enable all
            </button>
            <button
              disabled={disabled || enabled.size === 0}
              onClick={() => onChange({ exclude: analyzerRuleIds })}
              type="button"
            >
              Disable all
            </button>
          </div>
        </div>

        <p className={styles.ruleSelectionHint}>
          This is an extra client-side filter. A project's Coding Bible config
          still controls rule severity and can disable additional rules.
        </p>

        <div className={styles.ruleSelectionGroups}>
          {groups.map(([pack, packRules]) => {
            const enabledInPack = packRules.filter((rule) =>
              enabled.has(rule.id),
            );
            const allEnabled = enabledInPack.length === packRules.length;

            return (
              <section className={styles.ruleSelectionGroup} key={pack}>
                <div className={styles.ruleSelectionGroupHeading}>
                  <strong>{rulePackLabels[pack]}</strong>
                  <button
                    disabled={disabled}
                    onClick={() => setPackEnabled(packRules, !allEnabled)}
                    type="button"
                  >
                    {allEnabled ? "Disable pack" : "Enable pack"}
                  </button>
                </div>
                <div className={styles.ruleSelectionRules}>
                  {packRules.map((rule) => (
                    <label key={rule.id}>
                      <input
                        checked={enabled.has(rule.id)}
                        disabled={disabled}
                        onChange={(event) =>
                          setRuleEnabled(rule.id, event.target.checked)
                        }
                        type="checkbox"
                      />
                      <span>
                        <strong>{rule.id}</strong>
                        <span>{rule.title}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </details>
  );
};
