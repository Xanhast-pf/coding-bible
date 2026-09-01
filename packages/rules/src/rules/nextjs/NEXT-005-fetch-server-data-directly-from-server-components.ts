import type { CodingRule } from "../../types";

export const next005Rule = {
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
  bad: {
    language: "tsx",
    code: 'export default async function UsersPage() {\n  const response = await fetch("https://my-app.test/api/users");\n  const users = await response.json();\n  return <Users users={users} />;\n}',
  },
  good: {
    language: "tsx",
    code: "export default async function UsersPage() {\n  const users = await getUsers();\n  return <Users users={users} />;\n}",
  },
  references: [
    {
      label: "Next.js — Production checklist",
      url: "https://nextjs.org/docs/app/guides/production-checklist",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
