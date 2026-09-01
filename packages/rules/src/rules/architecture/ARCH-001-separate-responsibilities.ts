import type { CodingRule } from "../../types";

export const arch001Rule = {
  id: "ARCH-001",
  title: "Separate responsibilities",
  summary:
    "Rendering, orchestration, transformation, persistence, and external I/O should have explicit ownership.",
  rationale:
    "Separating responsibilities makes code easier to reason about, test, replace, and review without requiring knowledge of unrelated behavior.",
  level: "must",
  pack: "architecture",
  status: "stable",
  tags: ["architecture", "separation-of-concerns"],
  bad: {
    language: "ts",
    code: 'export const loadOrders = async () => {\n  const response = await fetch("/api/orders");\n  const orders = await response.json();\n  localStorage.setItem("orders", JSON.stringify(orders));\n  document.querySelector("#total")!.textContent = summarizeOrders(orders);\n};',
  },
  good: {
    language: "ts",
    code: "const orders = await orderApi.list();\nconst summary = summarizeOrders(orders);\n\norderCache.save(orders);\nrenderOrderSummary(summary);",
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
