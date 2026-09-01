import type { CodingRule } from "../../types";

export const next006Rule = {
  id: "NEXT-006",
  title: "Avoid avoidable data-fetching waterfalls",
  summary:
    "Start independent server requests in parallel and use Suspense/streaming boundaries when slow work should not block the whole route.",
  rationale:
    "Sequential independent requests accumulate latency, while parallel fetching and streaming can deliver useful UI earlier.",
  level: "should",
  pack: "nextjs",
  status: "stable",
  tags: ["data-fetching", "nextjs", "performance", "suspense"],
  bad: {
    language: "ts",
    code: "const user = await getUser();\nconst posts = await getPosts();",
  },
  good: {
    language: "ts",
    code: "const [posts, user] = await Promise.all([\n  getPosts(),\n  getUser(),\n]);",
  },
  references: [
    {
      label: "Next.js — Fetching Data",
      url: "https://nextjs.org/docs/app/getting-started/fetching-data",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
