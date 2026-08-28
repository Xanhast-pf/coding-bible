import type { CodingRule } from "../types";

export const nextjsRules = [
  {
    id: "NEXT-001",
    title: "Default to Server Components",
    summary:
      "In the App Router, keep components server-side unless they require state, event handlers, effects, custom client hooks, or browser-only APIs.",
    rationale:
      "Server Components reduce client JavaScript and can fetch data close to its source without exposing server credentials.",
    level: "should",
    pack: "nextjs",
    status: "stable",
    tags: ["client-components", "nextjs", "server-components"],
    references: [
      {
        label: "Next.js — Server and Client Components",
        url: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    references: [
      {
        label: "Next.js — use client",
        url: "https://nextjs.org/docs/app/api-reference/directives/use-client",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "NEXT-003",
    title: "Pass serializable props across the server-client boundary",
    summary:
      "Values passed from Server Components into Client Component entry points must be serializable by React.",
    rationale:
      "The React Server Component payload crosses a network boundary and cannot transport arbitrary runtime values such as callbacks.",
    level: "must",
    pack: "nextjs",
    status: "stable",
    tags: ["nextjs", "serialization", "server-components"],
    references: [
      {
        label: "Next.js — use client",
        url: "https://nextjs.org/docs/app/api-reference/directives/use-client",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "ast" },
  },
  {
    id: "NEXT-004",
    title: "Protect server-only code from client imports",
    summary:
      "Keep secrets, privileged data access, and server-only modules behind server boundaries and mark them server-only when accidental client import is plausible.",
    rationale:
      "Shared JavaScript module graphs make accidental environment leakage possible; build-time server-only guards turn that mistake into an explicit error.",
    level: "must",
    pack: "nextjs",
    status: "stable",
    tags: ["nextjs", "security", "server-only"],
    references: [
      {
        label: "Next.js — Server and Client Components",
        url: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
    id: "NEXT-005",
    title: "Fetch server data directly from Server Components",
    summary:
      "When code already runs on the server, call the data source or shared server data function directly instead of making an HTTP request to your own Route Handler.",
    rationale:
      "Calling your own server endpoint from a Server Component adds an unnecessary network hop and duplicates a boundary that is already local.",
    level: "should",
    pack: "nextjs",
    status: "stable",
    tags: ["data-fetching", "nextjs", "server-components"],
    references: [
      {
        label: "Next.js — Production checklist",
        url: "https://nextjs.org/docs/app/guides/production-checklist",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
  {
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
    references: [
      {
        label: "Next.js — Fetching Data",
        url: "https://nextjs.org/docs/app/getting-started/fetching-data",
      },
    ],
    detection: { autoFixable: false, detectable: true, strategy: "semantic" },
  },
] satisfies readonly CodingRule[];
