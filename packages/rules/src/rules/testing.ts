import type { CodingRule } from "../types";

export const testingRules = [
  {
    id: "TEST-001",
    title: "Test observable behavior",
    summary:
      "Tests should verify a unit's public responsibility rather than reproduce its internal implementation.",
    rationale:
      "Behavior-focused tests survive safe refactors and fail when user-visible or contract-visible behavior actually changes.",
    level: "must",
    pack: "testing",
    status: "stable",
    tags: ["behavior", "testing"],
    bad: {
      language: "ts",
      code: "openModal();\nexpect(modalController.state.isOpen).toBe(true);",
    },
    good: {
      language: "tsx",
      code: "openModal();\nexpect(screen.getByRole(\"dialog\")).toBeVisible();",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "TEST-002",
    title: "Test realistic states",
    summary:
      "Edge cases should come from real contracts and failure modes rather than impossible values invented only to increase coverage.",
    rationale:
      "Tests for impossible states add maintenance cost while distracting from failures the system can actually encounter.",
    level: "should",
    pack: "testing",
    status: "stable",
    tags: ["edge-cases", "testing"],
    bad: {
      language: "ts",
      code: "expect(formatUser(null as never)).toBe(\"Unknown\");",
    },
    good: {
      language: "ts",
      code: "expect(\n  formatUser({ firstName: \"\", lastName: \"Lee\" }),\n).toBe(\"Lee\");",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
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
      code: "vi.mock(\"payment-sdk\", () => ({\n  Client: class {\n    payments = { create: vi.fn().mockResolvedValue({ id: \"pay_1\" }) };\n  },\n}));",
    },
    good: {
      language: "ts",
      code: "const paymentGateway = {\n  charge: vi.fn().mockResolvedValue({ id: \"pay_1\" }),\n};\n\nawait checkout(order, { paymentGateway });",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "TEST-004",
    title: "Test pure logic directly",
    summary:
      "When transformation or decision logic has its own responsibility, test it at that boundary rather than only through a distant UI or controller.",
    rationale:
      "Direct tests are faster, clearer about failures, and avoid coupling business assertions to unrelated rendering or infrastructure.",
    level: "should",
    pack: "testing",
    status: "stable",
    tags: ["logic", "testing", "unit-tests"],
    bad: {
      language: "tsx",
      code: "render(<Checkout subtotal={100} tier=\"gold\" />);\nexpect(screen.getByText(\"$90.00\")).toBeVisible();",
    },
    good: {
      language: "ts",
      code: "expect(\n  calculateDiscount({ subtotal: 100, tier: \"gold\" }),\n).toBe(10);",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "TEST-005",
    title: "Use snapshots selectively",
    summary:
      "Prefer focused assertions when the behavior can be expressed directly; use snapshots when a meaningful structured output is expensive to assert piecemeal.",
    rationale:
      "Large snapshots are easy to approve mechanically and often obscure which behavior was intended to change.",
    level: "prefer",
    pack: "testing",
    status: "stable",
    tags: ["snapshots", "testing"],
    bad: {
      language: "tsx",
      code: "const { container } = render(<CheckoutPage />);\nexpect(container).toMatchSnapshot();",
    },
    good: {
      language: "tsx",
      code: "render(<CheckoutPage />);\nexpect(\n  screen.getByRole(\"heading\", { name: \"Checkout\" }),\n).toBeVisible();",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
  {
    id: "TEST-006",
    title: "Protect fixed bugs with regression tests",
    summary:
      "When a bug can be reproduced deterministically, add a test that fails before the fix and passes after it.",
    rationale:
      "A regression test preserves the newly learned system constraint and prevents the same defect from silently returning.",
    level: "should",
    pack: "testing",
    status: "stable",
    tags: ["regressions", "testing"],
    bad: {
      language: "ts",
      code: "expect(applyCoupon({ total: 100, expiresAt: tomorrow })).toBe(90);",
    },
    good: {
      language: "ts",
      code: "it(\"rejects a coupon at its exact expiry time\", () => {\n  const now = new Date(\"2026-08-28T12:00:00Z\");\n\n  expect(applyCoupon({ total: 100, expiresAt: now }, now)).toBe(100);\n});",
    },
    detection: {
      autoFixable: false,
      detectable: true,
      strategy: "semantic",
    },
  },
] satisfies readonly CodingRule[];
