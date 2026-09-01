import type { CodingRule } from "../../types";

export const next001Rule = {
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
  bad: {
    language: "tsx",
    code: '"use client";\n\nconst UsersPage = () => {\n  const [users, setUsers] = useState([]);\n  useEffect(() => void fetch("/api/users").then(/* ... */), []);\n  return <Users users={users} />;\n};',
  },
  good: {
    language: "tsx",
    code: "const UsersPage = async () => {\n  const users = await getUsers();\n  return <Users users={users} />;\n};",
  },
  references: [
    {
      label: "Next.js — Server and Client Components",
      url: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
