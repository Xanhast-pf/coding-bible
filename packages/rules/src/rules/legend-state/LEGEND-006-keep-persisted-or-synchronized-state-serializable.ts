import type { CodingRule } from "../../types";

export const legend006Rule = {
  id: "LEGEND-006",
  title: "Keep persisted or synchronized state serializable",
  summary:
    "When observable data crosses persistence, transport, devtool, or application-specific serialization boundaries, keep that state plain and serializable.",
  rationale:
    "Legend-State itself can hold functions and rich values, but serialization layers cannot reliably preserve arbitrary runtime objects or circular references.",
  level: "must",
  pack: "legend-state",
  status: "stable",
  tags: ["legend-state", "persistence", "serialization", "sync"],
  bad: {
    language: "ts",
    code: "store$.session.set({\n  lastSeen: new Date(),\n  onClose: closeSession,\n});",
  },
  good: {
    language: "ts",
    code: "store$.session.set({\n  lastSeenIso: new Date().toISOString(),\n});",
    note: "Use plain values for observable nodes that are persisted, synchronized, or transported.",
  },
  exceptions: [
    "Purely in-memory observables that never cross a serialization boundary may intentionally contain functions or other supported runtime values.",
  ],
  references: [
    {
      label: "Legend-State v3 — Observable",
      url: "https://legendapp.com/open-source/state/v3/usage/observable/",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
