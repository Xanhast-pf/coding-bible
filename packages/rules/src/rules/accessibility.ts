import type { CodingRule } from "../types";

export const accessibilityRules = [
  {
    id: "A11Y-001",
    title: "Prefer semantic HTML",
    summary:
      "Use the native element whose semantics match the interaction or content before recreating that behavior with generic elements.",
    rationale:
      "Native semantics provide keyboard behavior, accessibility information, and browser interoperability with less custom code.",
    level: "must",
    pack: "accessibility",
    status: "stable",
    tags: ["accessibility", "html", "semantics"],
    bad: {
      language: "tsx",
      code: '<div onClick={handleSave}>Save</div>',
    },
    good: {
      language: "tsx",
      code: '<button type="button" onClick={handleSave}>Save</button>',
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
] satisfies readonly CodingRule[];
