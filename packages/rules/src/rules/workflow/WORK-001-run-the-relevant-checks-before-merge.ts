import type { CodingRule } from "../../types";

export const work001Rule = {
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
    code: 'git commit -am "Ship feature"\ngit push',
  },
  good: {
    language: "bash",
    code: "pnpm check\npnpm build\n\n# Then commit and update the PR.",
  },
  detection: { autoFixable: false, detectable: false },
} satisfies CodingRule;
