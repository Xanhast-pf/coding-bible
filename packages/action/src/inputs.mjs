const booleanValues = new Map([
  ["true", true],
  ["false", false],
]);

// GitHub's runner uppercases input names and replaces spaces only; hyphens remain.
const inputEnvironmentKey = (name) =>
  `INPUT_${name.replaceAll(" ", "_").toUpperCase()}`;

const legacyInputEnvironmentKey = (name) =>
  inputEnvironmentKey(name).replaceAll("-", "_");

const readInput = (environment, name) => {
  const key = inputEnvironmentKey(name);
  const legacyKey = legacyInputEnvironmentKey(name);
  return (environment[key] ?? environment[legacyKey] ?? "").trim();
};

const readBooleanInput = (environment, name, fallback) => {
  const raw = readInput(environment, name);
  if (!raw) {
    return fallback;
  }

  const value = booleanValues.get(raw.toLowerCase());
  if (value === undefined) {
    throw new Error(`${name} must be true or false.`);
  }
  return value;
};

const readRuleListInput = (environment, name) => {
  const raw = readInput(environment, name);
  if (!raw) {
    return undefined;
  }

  const ruleIds = [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  return ruleIds.length ? ruleIds : undefined;
};

const readEnumInput = (environment, name, allowed, fallback) => {
  const raw = readInput(environment, name) || fallback;
  if (!allowed.includes(raw)) {
    throw new Error(`${name} must be one of: ${allowed.join(", ")}.`);
  }
  return raw;
};

export const readActionInputs = (environment = process.env) => {
  const include = readRuleListInput(environment, "rules");
  const exclude = readRuleListInput(environment, "exclude-rules");

  return {
    annotations: readBooleanInput(environment, "annotations", true),
    baseRef: readInput(environment, "base-ref") || null,
    baseline: readBooleanInput(environment, "baseline", true),
    configPath: readInput(environment, "config") || null,
    failOn: readEnumInput(
      environment,
      "fail-on",
      ["error", "warning", "none"],
      "error",
    ),
    path: readInput(environment, "path") || ".",
    ruleSelection: {
      ...(exclude ? { exclude } : {}),
      ...(include ? { include } : {}),
    },
    sarif: readBooleanInput(environment, "sarif", true),
    scope: readEnumInput(
      environment,
      "scope",
      ["changed", "project"],
      "changed",
    ),
  };
};
