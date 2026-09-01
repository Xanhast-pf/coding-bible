import type { CodingRule } from "../../types";

export const arch003Rule = {
  id: "ARCH-003",
  title: "Abstract after understanding repetition",
  summary:
    "Do not create a shared abstraction until the repeated behavior and its stable differences are understood.",
  rationale:
    "Small duplication is cheaper than a premature abstraction that couples unrelated use cases and becomes difficult to change.",
  level: "prefer",
  pack: "architecture",
  status: "stable",
  tags: ["abstraction", "architecture", "dry"],
  bad: {
    language: "ts",
    code: 'saveEntity("article", article, { draft: true, audit: false });\nsaveEntity("invoice", invoice, { draft: false, audit: true });',
  },
  good: {
    language: "ts",
    code: "saveArticleDraft(article);\nissueInvoice(invoice);\n\n// Extract shared behavior only after the common contract is clear.",
  },
  detection: {
    autoFixable: false,
    detectable: false,
  },
} satisfies CodingRule;
