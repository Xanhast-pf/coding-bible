import type { CodingRule } from "../../types";

export const next004Rule = {
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
  bad: {
    language: "ts",
    code: "export const getUsers = () => db.user.findMany();\nexport const apiSecret = process.env.API_SECRET;",
  },
  good: {
    language: "ts",
    code: 'import "server-only";\n\nexport const getUsers = () => db.user.findMany();',
  },
  references: [
    {
      label: "Next.js — Server and Client Components",
      url: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "semantic" },
} satisfies CodingRule;
