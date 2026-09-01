import type { CodingRule } from "../../types";

export const arch005Rule = {
  id: "ARCH-005",
  title: "Keep one source of truth",
  summary:
    "Do not maintain multiple independently writable representations of the same fact.",
  rationale:
    "Duplicated state can drift. A canonical owner with derived views removes synchronization bugs and clarifies responsibility.",
  level: "must",
  pack: "architecture",
  status: "stable",
  tags: ["architecture", "data-flow", "state"],
  bad: {
    language: "tsx",
    code: "const [items, setItems] = useState<Item[]>([]);\nconst [itemCount, setItemCount] = useState(0);\n\n// Both must now stay synchronized.",
  },
  good: {
    language: "tsx",
    code: "const [items, setItems] = useState<Item[]>([]);\nconst itemCount = items.length;",
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
