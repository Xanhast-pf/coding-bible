const booleanValues = new Map([
  ["true", true],
  ["false", false],
]);

const readInput = (environment, name) =>
  environment[`INPUT_${name.replaceAll("-", "_").toUpperCase()}`]?.trim() ?? "";

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

const readEnumInput = (environment, name, allowed, fallback) => {
  const raw = readInput(environment, name) || fallback;
  if (!allowed.includes(raw)) {
    throw new Error(`${name} must be one of: ${allowed.join(", ")}.`);
  }
  return raw;
};

export const readActionInputs = (environment = process.env) => ({
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
  sarif: readBooleanInput(environment, "sarif", true),
  scope: readEnumInput(environment, "scope", ["changed", "project"], "changed"),
});
