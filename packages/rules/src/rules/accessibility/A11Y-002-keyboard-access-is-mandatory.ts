import type { CodingRule } from "../../types";

export const a11y002Rule = {
  id: "A11Y-002",
  title: "Keyboard access is mandatory",
  summary:
    "Every interactive operation available with a pointer must also be operable from the keyboard when the platform interaction supports it.",
  rationale:
    "Pointer-only controls exclude keyboard and many assistive-technology users and usually indicate missing native semantics.",
  level: "must",
  pack: "accessibility",
  status: "stable",
  tags: ["accessibility", "interaction", "keyboard"],
  bad: {
    language: "tsx",
    code: '<div role="button" tabIndex={0} onClick={openMenu}>\n  Menu\n</div>',
  },
  good: {
    language: "tsx",
    code: '<button type="button" onClick={openMenu}>\n  Menu\n</button>',
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
