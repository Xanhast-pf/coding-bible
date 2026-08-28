import type { CodingRule } from "../types";

export const workflowRules = [
  {
    id: "WORK-001",
    title: "Run the relevant checks before merge",
    summary:
      "Type checking, linting, tests, build validation, generated artifacts, and other repository-specific checks should pass before code is merged.",
    rationale:
      "Automated checks are cheaper and more consistent than asking reviewers to manually detect failures the toolchain already knows how to prove.",
    level: "must",
    pack: "workflow",
    status: "stable",
    tags: ["ci", "quality", "workflow"],
    bad: {
      language: "bash",
      code: "git commit -am \"Ship feature\"\ngit push",
    },
    good: {
      language: "bash",
      code: "pnpm check\npnpm build\n\n# Then commit and update the PR.",
    },
    detection: { autoFixable: false, detectable: false },
  },
  {
    id: "WORK-002",
    title: "Keep changes scoped",
    summary:
      "Avoid mixing unrelated refactors, folder moves, migrations, cleanup, and behavior changes in one change unless the coupling is explicit and necessary.",
    rationale:
      "Focused diffs are easier to review, test, revert, and attribute when regressions occur.",
    level: "should",
    pack: "workflow",
    status: "stable",
    tags: ["pull-requests", "review", "scope"],
    bad: {
      language: "text",
      code: "PR: Add CSV export\n- Add CSV export\n- Rename utils/ to shared/\n- Replace the test runner\n- Reformat unrelated files",
    },
    good: {
      language: "text",
      code: "PR: Add CSV export\n- Add CSV export\n- Add export tests\n- Update export documentation",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "WORK-003",
    title: "Verify usage before deleting code",
    summary:
      "Search static, dynamic, generated, and runtime entry points before concluding that code is unused.",
    rationale:
      "Dead-code tools have blind spots around dynamic imports, reflection, configuration, and generated wiring; deleting live code is worse than temporarily keeping dead code.",
    level: "must",
    pack: "workflow",
    status: "stable",
    tags: ["dead-code", "refactoring", "workflow"],
    bad: {
      language: "bash",
      code: "rm src/legacyParser.ts",
    },
    good: {
      language: "bash",
      code: "rg \"legacyParser|parseLegacy\" src tests config\n# Inspect dynamic imports and generated/config wiring too.\nrm src/legacyParser.ts",
    },
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "WORK-004",
    title: "Call out deferred or dependent work",
    summary:
      "If tests, cleanup, migrations, or dependent changes intentionally land separately, make that dependency visible to reviewers.",
    rationale:
      "Explicit follow-up boundaries prevent incomplete work from being mistaken for finished work and reduce accidental merge-order problems.",
    level: "should",
    pack: "workflow",
    status: "stable",
    tags: ["communication", "pull-requests", "workflow"],
    bad: {
      language: "markdown",
      code: "## PR\nDone.",
    },
    good: {
      language: "markdown",
      code: "## PR\nAdds the new parser.\n\nFollow-up: #482 removes the legacy parser after migration.\nDepends on: #479 landing first.",
    },
    detection: { autoFixable: false, detectable: false },
  },
] satisfies readonly CodingRule[];
