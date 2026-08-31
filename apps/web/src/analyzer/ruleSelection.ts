import {
  analyzerRuleIds,
  createAnalyzerRuleSelectionPredicate,
  normalizeAnalyzerRuleSelection,
  type AnalyzerRuleSelection,
} from "@coding-bible/analyzer";

export const browserRuleSelectionStorageKey =
  "coding-bible:browser-rule-selection:v1";

interface RuleSelectionStorage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

export const getEnabledAnalyzerRuleIds = (
  selection: AnalyzerRuleSelection,
): readonly string[] => {
  const isSelected = createAnalyzerRuleSelectionPredicate(selection);
  return analyzerRuleIds.filter(isSelected);
};

export const createRuleSelectionFromEnabledIds = (
  enabledRuleIds: readonly string[],
): AnalyzerRuleSelection => {
  const enabled = new Set(enabledRuleIds);
  const exclude = analyzerRuleIds.filter((ruleId) => !enabled.has(ruleId));
  return exclude.length ? { exclude } : {};
};

export const parseBrowserRuleSelection = (
  value: string | null,
): AnalyzerRuleSelection => {
  if (!value) {
    return {};
  }

  try {
    return normalizeAnalyzerRuleSelection(JSON.parse(value));
  } catch {
    return {};
  }
};

const getBrowserStorage = (): RuleSelectionStorage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readBrowserRuleSelection = (
  storage: RuleSelectionStorage | null = getBrowserStorage(),
): AnalyzerRuleSelection => {
  try {
    return parseBrowserRuleSelection(
      storage?.getItem(browserRuleSelectionStorageKey) ?? null,
    );
  } catch {
    return {};
  }
};

export const writeBrowserRuleSelection = (
  selection: AnalyzerRuleSelection,
  storage: RuleSelectionStorage | null = getBrowserStorage(),
) => {
  if (!storage) {
    return;
  }

  const normalized = normalizeAnalyzerRuleSelection(selection);
  if (!normalized.include?.length && !normalized.exclude?.length) {
    try {
      storage.removeItem(browserRuleSelectionStorageKey);
    } catch {
      // Analysis still works when browser privacy settings block storage.
    }
    return;
  }

  try {
    storage.setItem(browserRuleSelectionStorageKey, JSON.stringify(normalized));
  } catch {
    // Analysis still works when browser privacy/quota settings block storage.
  }
};
