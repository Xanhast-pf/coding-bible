import type { CodingRule } from "../../types";

export const next003Rule = {
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
  bad: {
    language: "tsx",
    code: "// Server Component\nconst formatPrice = (value: number) => `$${value}`;\nreturn <ClientPrice amount={12} formatPrice={formatPrice} />;",
  },
  good: {
    language: "tsx",
    code: '// Server Component\nreturn <ClientPrice amount={12} currency="USD" />;',
    note: "Pass serializable data and keep ordinary client behavior inside the Client Component.",
  },
  references: [
    {
      label: "Next.js — use client",
      url: "https://nextjs.org/docs/app/api-reference/directives/use-client",
    },
  ],
  detection: { autoFixable: false, detectable: true, strategy: "ast" },
} satisfies CodingRule;
