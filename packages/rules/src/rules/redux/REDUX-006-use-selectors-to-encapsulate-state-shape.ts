import type { CodingRule } from "../../types";

export const redux006Rule = {
  id: "REDUX-006",
  title: "Use selectors to encapsulate state shape",
  summary:
    "Reusable consumers should ask selectors for domain values instead of spreading knowledge of deep store paths throughout the UI.",
  rationale:
    "Selectors create a stable read boundary so state structure can change without rewriting every consumer.",
  level: "should",
  pack: "redux",
  status: "stable",
  tags: ["encapsulation", "redux", "selectors"],
  bad: {
    language: "tsx",
    code: "const currency = useSelector(\n  (state) => state.account.preferences.checkout.currency,\n);",
  },
  good: {
    language: "tsx",
    code: "const selectCheckoutCurrency = (state) =>\n  state.account.preferences.checkout.currency;\n\nconst currency = useSelector(selectCheckoutCurrency);",
  },
  references: [
    {
      label: "Redux — Deriving Data with Selectors",
      url: "https://redux.js.org/usage/deriving-data-selectors",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
