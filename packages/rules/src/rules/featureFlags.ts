import type { CodingRule } from "../types";

export const featureFlagRules = [
  {
    id: "FLAG-001",
    title: "Every feature flag needs a removal plan",
    summary:
      "Create flags with an owner and a planned condition or date for removal.",
    rationale:
      "Flags are temporary branches in production code. Without an explicit end condition they become permanent complexity.",
    level: "must",
    pack: "feature-flags",
    status: "stable",
    tags: ["feature-flags", "maintenance"],
    bad: {
      language: "ts",
      code: "export const flags = {\n  newCheckout: false,\n};",
    },
    good: {
      language: "ts",
      code: 'export const flags = {\n  newCheckout: {\n    defaultValue: false,\n    owner: "checkout",\n    removalCondition: "100% rollout is stable for 7 days",\n  },\n};',
    },
    detection: { autoFixable: false, detectable: false },
  },
  {
    id: "FLAG-002",
    title: "Delete flags after rollout",
    summary:
      "When rollout is complete, remove the code branches, tests that exist only for the flag, and the remote flag definition.",
    rationale:
      "Completed flags create dead branches and make maintainers reason about product states that can no longer occur.",
    level: "must",
    pack: "feature-flags",
    status: "stable",
    tags: ["cleanup", "feature-flags"],
    bad: {
      language: "ts",
      code: "if (flags.newCheckout) {\n  return renderNewCheckout();\n}\n\nreturn renderLegacyCheckout();",
    },
    good: {
      language: "ts",
      code: "return renderNewCheckout();",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "FLAG-003",
    title: "Keep flag decisions at clear boundaries",
    summary:
      "Evaluate a feature flag in as few places as practical and pass the resulting behavior or state inward.",
    rationale:
      "Scattered flag checks create combinatorial states and make eventual removal much harder.",
    level: "should",
    pack: "feature-flags",
    status: "stable",
    tags: ["architecture", "feature-flags"],
    bad: {
      language: "ts",
      code: "const price = flags.newPricing ? getNewPrice() : getLegacyPrice();\nconst tax = flags.newPricing ? getNewTax() : getLegacyTax();\nconst total = flags.newPricing ? getNewTotal() : getLegacyTotal();",
    },
    good: {
      language: "ts",
      code: "const pricing = flags.newPricing ? newPricing : legacyPricing;\n\nconst price = pricing.getPrice();\nconst tax = pricing.getTax();\nconst total = pricing.getTotal();",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "FLAG-004",
    title: "Test both reachable flag states",
    summary:
      "While a feature flag is active, test the meaningful enabled and disabled behavior that can reach production.",
    rationale:
      "A flag creates multiple production paths; only testing the preferred path leaves the fallback branch to rot.",
    level: "must",
    pack: "feature-flags",
    status: "stable",
    tags: ["feature-flags", "testing"],
    bad: {
      language: "ts",
      code: 'it("uses the new checkout", () => {\n  setFlag("newCheckout", true);\n  expect(renderCheckout()).toBe("new");\n});',
    },
    good: {
      language: "ts",
      code: 'it.each([\n  [true, "new"],\n  [false, "legacy"],\n])("newCheckout=%s renders %s", (enabled, expected) => {\n  setFlag("newCheckout", enabled);\n  expect(renderCheckout()).toBe(expected);\n});',
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
