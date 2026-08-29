import { fromJsonSchema, McpServer } from "@modelcontextprotocol/server";

import { checkCode, type CheckCodeInput } from "./checkCode.ts";
import { checkFiles, type CheckFilesInput } from "./checkFiles.ts";
import { codingBibleCanonicalUrl, codingBibleMcpVersion } from "./constants.ts";
import { getProjectGuidance } from "./projectGuidance.ts";
import { getRule } from "./getRule.ts";
import { reviewDiff, type ReviewDiffInput } from "./reviewDiff.ts";
import {
  checkCodeInputSchema,
  checkFilesInputSchema,
  getProjectGuidanceInputSchema,
  getRuleInputSchema,
  reviewDiffInputSchema,
  searchRulesInputSchema,
} from "./schemas.ts";
import { searchRules, type SearchRulesInput } from "./searchRules.ts";

export interface CodingBibleMcpServerOptions {
  canonicalBaseUrl?: string;
  rootDirectory?: string;
}

interface GetRuleInput {
  ruleId: string;
}

interface GetProjectGuidanceInput {
  path?: string;
}

const toolAnnotations = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true,
} as const;

const toStructuredContent = (value: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value));

const asToolResult = (value: object, text: string) => ({
  content: [{ type: "text" as const, text }],
  structuredContent: toStructuredContent(value),
});

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Coding Bible MCP tool failed.";

const asToolError = (error: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: getErrorMessage(error),
    },
  ],
  isError: true,
});

const summarizeCodeCheck = (result: ReturnType<typeof checkCode>) => {
  if (result.summary.diagnostics) {
    return `Coding Bible could not fully analyze ${result.fileName}: ${result.summary.diagnostics} syntax diagnostic(s).`;
  }

  return `Coding Bible checked ${result.fileName} with ${result.summary.checksRun} detector(s) and found ${result.summary.findings} deterministic violation(s).`;
};

const summarizeFileCheck = (result: Awaited<ReturnType<typeof checkFiles>>) => {
  const { summary } = result.analyzer;
  return `Coding Bible checked ${summary.filesAnalyzed} file(s): ${summary.errors} error(s), ${summary.warnings} warning(s), ${summary.diagnostics} syntax diagnostic(s). The structured result includes canonical references for every rule that fired.`;
};

const summarizeDiffReview = (
  result: Awaited<ReturnType<typeof reviewDiff>>,
) => {
  const { summary } = result;
  const findingLocations = result.findings
    .slice(0, 5)
    .map(
      ({ file, location, ruleId }) => `${ruleId} at ${file}:${location.line}`,
    );
  const suffix = findingLocations.length
    ? ` First findings: ${findingLocations.join(", ")}.`
    : "";

  return `Coding Bible reviewed ${summary.changedLines} added/modified line(s) across ${summary.filesInDiff} diff file(s) and found ${summary.findings} deterministic violation(s) on changed lines.${suffix}`;
};

const summarizeRuleSearch = (result: ReturnType<typeof searchRules>) => {
  if (!result.results.length) {
    return `No Coding Bible rules matched “${result.query}”.`;
  }

  return `Found ${result.totalMatches} Coding Bible rule match(es) for “${result.query}”. Top matches: ${result.results
    .slice(0, 5)
    .map(({ rule }) => `${rule.id} — ${rule.title}`)
    .join("; ")}.`;
};

export const createCodingBibleMcpServer = (
  options: CodingBibleMcpServerOptions = {},
) => {
  const canonicalBaseUrl = options.canonicalBaseUrl ?? codingBibleCanonicalUrl;
  const rootDirectory = options.rootDirectory ?? process.cwd();
  const server = new McpServer({
    name: "coding-bible",
    version: codingBibleMcpVersion,
  });

  server.registerTool(
    "check_code",
    {
      title: "Check in-memory code",
      description:
        "Use for pasted or unsaved JavaScript/TypeScript snippets. Runs only Coding Bible's implemented deterministic detectors and returns syntax diagnostics, findings, and canonical rule references. Use check_files instead when project files and tsconfig context are available.",
      inputSchema: fromJsonSchema<CheckCodeInput>(checkCodeInputSchema),
      annotations: toolAnnotations,
    },
    async (input) => {
      try {
        const result = checkCode(input, { canonicalBaseUrl });
        return asToolResult(result, summarizeCodeCheck(result));
      } catch (error) {
        return asToolError(error);
      }
    },
  );

  server.registerTool(
    "check_files",
    {
      title: "Check project files",
      description:
        "Use for existing files/directories when project context matters. Delegates to Coding Bible's project-aware analyzer, honoring config, tsconfig, and baseline semantics while disabling cache writes. Paths are constrained to the configured MCP root. A clean result covers deterministic rules only.",
      inputSchema: fromJsonSchema<CheckFilesInput>(checkFilesInputSchema),
      annotations: toolAnnotations,
    },
    async (input, context) => {
      try {
        const result = await checkFiles(input, {
          canonicalBaseUrl,
          rootDirectory,
          signal: context.mcpReq.signal,
        });
        return asToolResult(result, summarizeFileCheck(result));
      } catch (error) {
        return asToolError(error);
      }
    },
  );

  server.registerTool(
    "review_diff",
    {
      title: "Review a Git diff",
      description:
        "Use before commit or during code review. Accepts a standard unified Git diff, analyzes the corresponding current working-tree files with project context, and returns only deterministic findings/diagnostics that touch added or modified lines. It does not modify files, reason about deleted-only code, or claim semantic review coverage.",
      inputSchema: fromJsonSchema<ReviewDiffInput>(reviewDiffInputSchema),
      annotations: toolAnnotations,
    },
    async (input, context) => {
      try {
        const result = await reviewDiff(input, {
          canonicalBaseUrl,
          rootDirectory,
          signal: context.mcpReq.signal,
        });
        return asToolResult(result, summarizeDiffReview(result));
      } catch (error) {
        return asToolError(error);
      }
    },
  );

  server.registerTool(
    "search_rules",
    {
      title: "Search Coding Bible rules",
      description:
        "Use when you know the engineering concept but not the exact Coding Bible rule ID. Searches canonical rule IDs, titles, summaries, rationale, tags, and pack names; stable rules are searched by default. Follow with get_rule when the full canonical rule/prompt is needed.",
      inputSchema: fromJsonSchema<SearchRulesInput>(searchRulesInputSchema),
      annotations: toolAnnotations,
    },
    async (input) => {
      try {
        const result = searchRules(input, { canonicalBaseUrl });
        return asToolResult(result, summarizeRuleSearch(result));
      } catch (error) {
        return asToolError(error);
      }
    },
  );

  server.registerTool(
    "get_rule",
    {
      title: "Get a canonical rule",
      description:
        "Use when a Coding Bible rule ID is already known. Returns the canonical rule data, rationale, examples, exceptions, references, deep link, and agent-ready prompt. Use search_rules first when the ID is unknown.",
      inputSchema: fromJsonSchema<GetRuleInput>(getRuleInputSchema),
      annotations: toolAnnotations,
    },
    async ({ ruleId }) => {
      const result = getRule(ruleId, { canonicalBaseUrl });
      if (!result) {
        return asToolError(new Error(`Unknown Coding Bible rule: ${ruleId}`));
      }

      return asToolResult(result, result.prompt);
    },
  );

  server.registerTool(
    "get_project_guidance",
    {
      title: "Get project-specific guidance",
      description:
        "Use near the start of work on a repository to obtain the stable Coding Bible guidance relevant to that project's detected ecosystem. Foundation and quality packs are always included; ecosystem packs are selected conservatively from local package manifests.",
      inputSchema: fromJsonSchema<GetProjectGuidanceInput>(
        getProjectGuidanceInputSchema,
      ),
      annotations: toolAnnotations,
    },
    async (input) => {
      try {
        const result = await getProjectGuidance(input, {
          canonicalBaseUrl,
          rootDirectory,
        });
        return asToolResult(result, result.guidance);
      } catch (error) {
        return asToolError(error);
      }
    },
  );

  return server;
};
