import type { CodingRule } from "../../types";
import { react001Rule } from "./REACT-001-keep-components-focused-on-presentation.ts";
import { react002Rule } from "./REACT-002-do-not-memoize-by-reflex.ts";
import { react003Rule } from "./REACT-003-keep-state-as-local-as-practical.ts";
import { react004Rule } from "./REACT-004-do-not-store-derived-state.ts";
import { react005Rule } from "./REACT-005-use-effects-to-synchronize-external-systems.ts";
import { react006Rule } from "./REACT-006-use-stable-list-keys.ts";
import { react007Rule } from "./REACT-007-keep-render-pure.ts";
import { react008Rule } from "./REACT-008-move-static-values-out-of-components.ts";
import { react009Rule } from "./REACT-009-follow-the-rules-of-hooks.ts";
import { react010Rule } from "./REACT-010-let-react-call-components.ts";
import { react011Rule } from "./REACT-011-treat-props-state-and-hook-inputs-as-immutable-snapshots.ts";
import { react012Rule } from "./REACT-012-do-not-suppress-hook-dependency-correctness.ts";
import { react013Rule } from "./REACT-013-extract-coherent-react-responsibilities-not-arbitrary-line-counts.ts";

export const reactRules = [
  react001Rule,
  react002Rule,
  react003Rule,
  react004Rule,
  react005Rule,
  react006Rule,
  react007Rule,
  react008Rule,
  react009Rule,
  react010Rule,
  react011Rule,
  react012Rule,
  react013Rule,
] satisfies readonly CodingRule[];
