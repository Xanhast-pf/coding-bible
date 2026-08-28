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
  {
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
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "A11Y-003",
    title: "Keep focus visible",
    summary:
      "Interactive elements must expose a clear visible state when they receive keyboard focus.",
    rationale:
      "Keyboard users need a persistent visual indicator of where the next interaction will occur.",
    level: "must",
    pack: "accessibility",
    status: "stable",
    tags: ["accessibility", "focus", "keyboard"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "A11Y-004",
    title: "Controls need accessible names",
    summary:
      "Inputs and interactive controls must expose a meaningful programmatic name through visible text, a label, or appropriate accessible naming.",
    rationale:
      "A control that is visually recognizable but unnamed programmatically is ambiguous or unusable to assistive technology.",
    level: "must",
    pack: "accessibility",
    status: "stable",
    tags: ["accessibility", "forms", "labels"],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "A11Y-005",
    title: "Do not communicate with color alone",
    summary:
      "When color carries status or meaning, provide another perceivable cue such as text, iconography, shape, or position.",
    rationale:
      "Color perception varies and may be unavailable entirely. Redundant cues make meaning robust for more users and environments.",
    level: "must",
    pack: "accessibility",
    status: "stable",
    tags: ["accessibility", "color", "semantics"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "A11Y-006",
    title: "Respect reduced motion preferences",
    summary:
      "Non-essential animation and smooth motion should adapt when the user requests reduced motion.",
    rationale:
      "Motion can cause discomfort or make interfaces harder to use, and operating systems expose a preference specifically for this need.",
    level: "must",
    pack: "accessibility",
    status: "stable",
    tags: ["accessibility", "motion", "preferences"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
