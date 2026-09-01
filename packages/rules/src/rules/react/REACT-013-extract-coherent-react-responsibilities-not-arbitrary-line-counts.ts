import type { CodingRule } from "../../types";

export const react013Rule = {
  id: "REACT-013",
  title: "Extract coherent React responsibilities, not arbitrary line counts",
  summary:
    "Split a component or custom Hook when it owns multiple independent responsibilities or becomes difficult to scan, not merely because it crossed a fixed LOC threshold.",
  rationale:
    "Small focused units are easier to test and understand, but mechanical file-size limits often create fragmentation without improving cohesion.",
  level: "should",
  pack: "react",
  status: "stable",
  tags: ["components", "hooks", "react", "separation-of-concerns"],
  bad: {
    language: "tsx",
    code: "const Dashboard = () => {\n  const billing = useBilling();\n  const notifications = useNotifications();\n  const search = useSearch();\n\n  return <DashboardView {...{ billing, notifications, search }} />;\n};",
  },
  good: {
    language: "tsx",
    code: "const Dashboard = () => (\n  <>\n    <BillingPanel />\n    <NotificationsPanel />\n    <SearchPanel />\n  </>\n);",
    note: "Split by coherent responsibility, not because a file crossed an arbitrary line count.",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
