import type { CodingRule } from "../../types";

export const flag004Rule = {
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
} satisfies CodingRule;
