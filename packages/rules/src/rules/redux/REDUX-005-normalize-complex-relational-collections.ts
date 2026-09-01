import type { CodingRule } from "../../types";

export const redux005Rule = {
  id: "REDUX-005",
  title: "Normalize complex relational collections",
  summary:
    "Store heavily relational or repeatedly updated entity data in a normalized shape, typically with createEntityAdapter.",
  rationale:
    "Normalization makes entity lookup and single-item updates simpler and reduces duplicated nested copies of the same entity.",
  level: "should",
  pack: "redux",
  status: "stable",
  tags: ["entities", "normalization", "redux"],
  bad: {
    language: "ts",
    code: 'const posts = [\n  { id: "p1", author: { id: "u1", name: "Ada" } },\n  { id: "p2", author: { id: "u1", name: "Ada" } },\n];',
  },
  good: {
    language: "ts",
    code: 'const state = {\n  authors: { byId: { u1: { id: "u1", name: "Ada" } } },\n  posts: { byId: { p1: { id: "p1", authorId: "u1" } } },\n};',
  },
  references: [
    {
      label: "Redux — Normalizing State Shape",
      url: "https://redux.js.org/usage/structuring-reducers/normalizing-state-shape",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
