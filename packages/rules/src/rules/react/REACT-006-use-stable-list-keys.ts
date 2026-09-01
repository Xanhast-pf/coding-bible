import type { CodingRule } from "../../types";

export const react006Rule = {
  id: "REACT-006",
  title: "Use stable list keys",
  summary:
    "Keys should identify the same logical item across inserts, deletes, sorting, and re-rendering.",
  rationale:
    "Unstable keys can preserve state on the wrong item or force unnecessary unmounts and remounts.",
  level: "must",
  pack: "react",
  status: "stable",
  tags: ["keys", "lists", "react"],
  bad: {
    language: "tsx",
    code: "items.map((item, index) => <Row key={index} item={item} />)",
  },
  good: {
    language: "tsx",
    code: "items.map((item) => <Row key={item.id} item={item} />)",
  },
  exceptions: [
    "An index key is acceptable for a truly static list whose ordering and membership can never change.",
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
