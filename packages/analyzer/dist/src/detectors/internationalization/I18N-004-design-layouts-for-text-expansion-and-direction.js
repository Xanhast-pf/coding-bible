import { createSourceEvidenceDetector } from "../shared/sourceEvidence.js";
const blockPattern = /([^{}]+)\{([^{}]*)\}/g;
const directionalProperty = /\b(?:margin-left|margin-right|padding-left|padding-right)\s*:/m;
const fixedWidth = /\bwidth\s*:\s*\d+(?:px|rem|em)\b/m;
const noWrap = /\bwhite-space\s*:\s*nowrap\b/m;
const detector = createSourceEvidenceDetector({
    id: "i18n_004-directional-fixed-nowrap-block",
    ruleId: "I18N-004",
    languages: ["css"],
    profile: {
        confidence: "strong",
        impact: "medium",
    },
    message: "A single CSS rule combines directional spacing, fixed width, and nowrap, which is brittle for RTL and text expansion.",
    suggestion: "Prefer logical properties and a layout that can grow or wrap translated text.",
    find: (context) => {
        const evidence = [];
        for (const match of context.source.matchAll(blockPattern)) {
            const body = match[2] ?? "";
            if (!directionalProperty.test(body) ||
                !fixedWidth.test(body) ||
                !noWrap.test(body)) {
                continue;
            }
            const local = directionalProperty.exec(body);
            if (!local)
                continue;
            const start = (match.index ?? 0) + match[0].indexOf(body) + local.index;
            evidence.push({ start, end: start + local[0].length });
        }
        return evidence;
    },
});
export const i18n004Detectors = [detector];
