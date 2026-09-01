import type { CodingRule } from "../../types";

export const test003Rule = {
  id: "TEST-003",
  title: "Mock the boundary, not its implementation",
  summary:
    "Replace external collaborators with the smallest useful test double instead of recreating the library or service inside the test.",
  rationale:
    "Complex mocks duplicate behavior, drift from reality, and can make tests pass against a fake system that production never runs.",
  level: "should",
  pack: "testing",
  status: "stable",
  tags: ["mocks", "testing"],
  bad: {
    language: "ts",
    code: 'vi.mock("payment-sdk", () => ({\n  Client: class {\n    payments = { create: vi.fn().mockResolvedValue({ id: "pay_1" }) };\n  },\n}));',
  },
  good: {
    language: "ts",
    code: 'const paymentGateway = {\n  charge: vi.fn().mockResolvedValue({ id: "pay_1" }),\n};\n\nawait checkout(order, { paymentGateway });',
  },
  detection: {
    autoFixable: false,
    detectable: true,
    strategy: "semantic",
  },
} satisfies CodingRule;
