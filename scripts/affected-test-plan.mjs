const ALL_TARGETS = [
  "@coding-bible/rules",
  "@coding-bible/analyzer",
  "@coding-bible/action",
  "@coding-bible/mcp",
  "@coding-bible/web",
];

const ROOT_IMPACT_PATTERNS = [
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^tsconfig\.base\.json$/,
  /^eslint\.config\.mjs$/,
  /^knip\.jsonc$/,
  /^lint-staged\.config\.mjs$/,
  /^scripts\//,
];

export function planAffectedTests(files) {
  const normalized = files.map((file) => file.replaceAll("\\", "/"));

  if (
    normalized.some((file) =>
      ROOT_IMPACT_PATTERNS.some((pattern) => pattern.test(file)),
    )
  ) {
    return [...ALL_TARGETS];
  }

  const targets = new Set();

  for (const file of normalized) {
    if (file.startsWith("packages/rules/")) {
      targets.add("@coding-bible/rules");
      targets.add("@coding-bible/action");
      targets.add("@coding-bible/mcp");
      targets.add("@coding-bible/web");
      continue;
    }

    if (file.startsWith("packages/analyzer/")) {
      targets.add("@coding-bible/analyzer");
      targets.add("@coding-bible/action");
      targets.add("@coding-bible/mcp");
      targets.add("@coding-bible/web");
      continue;
    }

    if (file.startsWith("packages/action/")) {
      targets.add("@coding-bible/action");
      continue;
    }

    if (file.startsWith("packages/mcp/")) {
      targets.add("@coding-bible/mcp");
      continue;
    }

    if (file.startsWith("apps/web/")) {
      targets.add("@coding-bible/web");
      continue;
    }

    if (file.startsWith("apps/") || file.startsWith("packages/")) {
      return [...ALL_TARGETS];
    }
  }

  return ALL_TARGETS.filter((target) => targets.has(target));
}
