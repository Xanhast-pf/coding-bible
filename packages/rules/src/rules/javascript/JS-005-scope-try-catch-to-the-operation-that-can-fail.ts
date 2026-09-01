import type { CodingRule } from "../../types";

export const js005Rule = {
  id: "JS-005",
  title: "Scope try/catch to the operation that can fail",
  summary:
    "Keep setup and unrelated transformation outside a try block unless those operations are intentionally part of the same failure boundary.",
  rationale:
    "A narrow catch boundary makes it clear what failed and prevents unrelated programming errors from being mistaken for expected operational failures.",
  level: "should",
  pack: "javascript",
  status: "stable",
  tags: ["errors", "try-catch"],
  bad: {
    language: "ts",
    code: "try {\n  const payload = buildPayload(form);\n  const result = await api.save(payload);\n  renderResult(result);\n} catch {\n  showNetworkError();\n}",
  },
  good: {
    language: "ts",
    code: "const payload = buildPayload(form);\n\nlet result: SaveResult;\ntry {\n  result = await api.save(payload);\n} catch {\n  showNetworkError();\n  return;\n}\n\nrenderResult(result);",
  },
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
