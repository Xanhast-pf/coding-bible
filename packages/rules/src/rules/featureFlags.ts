import type { CodingRule } from "../types";

export const featureFlagRules = [
  {
    id: "FLAG-001",
    title: "Every feature flag needs a removal plan",
    summary:
      "Create flags with an owner and a planned condition or date for removal.",
    rationale:
      "Flags are temporary branches in production code. Without an explicit end condition they become permanent complexity.",
    level: "must",
    pack: "feature-flags",
    status: "stable",
    tags: ["feature-flags", "maintenance"],
    detection: { autoFixable: false, detectable: false },
  },
  {
    id: "FLAG-002",
    title: "Delete flags after rollout",
    summary:
      "When rollout is complete, remove the code branches, tests that exist only for the flag, and the remote flag definition.",
    rationale:
      "Completed flags create dead branches and make maintainers reason about product states that can no longer occur.",
    level: "must",
    pack: "feature-flags",
    status: "stable",
    tags: ["cleanup", "feature-flags"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "FLAG-003",
    title: "Keep flag decisions at clear boundaries",
    summary:
      "Evaluate a feature flag in as few places as practical and pass the resulting behavior or state inward.",
    rationale:
      "Scattered flag checks create combinatorial states and make eventual removal much harder.",
    level: "should",
    pack: "feature-flags",
    status: "stable",
    tags: ["architecture", "feature-flags"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "FLAG-004",
    title: "Test both reachable flag states",
    summary:
      "While a feature flag is active, test the meaningful enabled and disabled behavior that can reach production.",
    rationale:
      "A flag creates multiple production paths; only testing the preferred path leaves the fallback branch to rot.",
    level: "must",
    pack: "feature-flags",
    status: "stable",
    tags: ["feature-flags", "testing"],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
