import type { CodingRule } from "../../types";

export const next002Rule = {
  id: "NEXT-002",
  title: "Keep use client boundaries as small as practical",
  summary:
    "Mark the client entry point that needs interactivity instead of moving an entire page or layout into the client module graph.",
  rationale:
    "Everything imported below a use client boundary contributes to the client graph, so unnecessarily high boundaries increase shipped JavaScript.",
  level: "should",
  pack: "nextjs",
  status: "stable",
  tags: ["bundle-size", "client-components", "nextjs"],
  bad: {
    language: "tsx",
    code: '"use client";\n\nexport default function Dashboard() {\n  return <LargeDashboardWithOneInteractiveButton />;\n}',
  },
  good: {
    language: "tsx",
    code: '// Dashboard.tsx — Server Component\nexport default function Dashboard() {\n  return <FavoriteButton />;\n}\n\n// FavoriteButton.tsx\n"use client";',
  },
  references: [
    {
      label: "Next.js — use client",
      url: "https://nextjs.org/docs/app/api-reference/directives/use-client",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
