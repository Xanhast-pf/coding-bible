import type {
  AnalyzeResult,
  AnalyzerDiagnostic,
  AnalyzerFinding,
  AnalyzerLanguage,
} from "@coding-bible/analyzer";
import { rulePackLabels, rules } from "@coding-bible/rules";
import { useState } from "react";

import styles from "./AnalyzeView.module.css";

const sampleSource = `import { User } from "./types";

const UserCard = ({ user }: { user: User }) => <strong>{user.name}</strong>;

function UserList({ users }: { users: User[] }) {
  if (users.length > 0) {
    useState(0);
  }

  useEffect(() => syncUsers(users), []); // eslint-disable-line react-hooks/exhaustive-deps

  return users.map((user, index) => <UserCard key={index} user={user} />);
}

const payload = (await response.json()) as User[];
const page = parseInt(rawPage);
const unsafe = (value: any) => value;
const preview = UserCard({ user: payload[0] });`;

const languageOptions = [
  ["tsx", "TypeScript + JSX"],
  ["ts", "TypeScript"],
  ["jsx", "JavaScript + JSX"],
  ["js", "JavaScript"],
] as const satisfies readonly (readonly [AnalyzerLanguage, string])[];

const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

const isAnalyzerLanguage = (value: string): value is AnalyzerLanguage =>
  languageOptions.some(([language]) => language === value);

const DiagnosticCard = ({ diagnostic }: { diagnostic: AnalyzerDiagnostic }) => (
  <article className={`${styles.finding} ${styles.diagnostic}`}>
    <div className={styles.findingMeta}>
      <span className={styles.diagnosticLabel}>Syntax</span>
      <span className={styles.location}>
        line {diagnostic.location.line}:{diagnostic.location.column}
      </span>
    </div>
    <h3 className={styles.findingTitle}>Fix syntax before rule analysis</h3>
    <p className={styles.message}>{diagnostic.message}</p>
    <pre className={styles.excerpt}>
      <code>
        <span aria-hidden="true" className={styles.excerptLineNumber}>
          {diagnostic.location.line}
        </span>
        <span>{diagnostic.excerpt}</span>
      </code>
    </pre>
    <p className={styles.suggestion}>
      Coding Bible pauses rule detectors on malformed syntax to avoid misleading
      findings.
    </p>
  </article>
);

const FindingCard = ({ finding }: { finding: AnalyzerFinding }) => {
  const rule = rulesById.get(finding.ruleId);

  return (
    <article className={styles.finding} data-level={rule?.level ?? "should"}>
      <div className={styles.findingMeta}>
        <a className={styles.ruleId} href={`./#${finding.ruleId}`}>
          {finding.ruleId}
        </a>
        {rule ? (
          <>
            <span className={styles.level}>{rule.level}</span>
            <span className={styles.pack}>{rulePackLabels[rule.pack]}</span>
          </>
        ) : null}
        <span className={styles.location}>
          line {finding.location.line}:{finding.location.column}
        </span>
      </div>

      <h3 className={styles.findingTitle}>{rule?.title ?? finding.ruleId}</h3>
      <p className={styles.message}>{finding.message}</p>

      <pre className={styles.excerpt}>
        <code>
          <span aria-hidden="true" className={styles.excerptLineNumber}>
            {finding.location.line}
          </span>
          <span>{finding.excerpt}</span>
        </code>
      </pre>

      <p className={styles.suggestion}>{finding.suggestion}</p>
      <a className={styles.viewRule} href={`./#${finding.ruleId}`}>
        View rule →
      </a>
    </article>
  );
};

export const AnalyzeView = () => {
  const [language, setLanguage] = useState<AnalyzerLanguage>("tsx");
  const [source, setSource] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const resetResult = () => {
    setResult(null);
    setStatus("idle");
  };

  const handleAnalyze = async () => {
    if (!source.trim() || status === "loading") {
      return;
    }

    setStatus("loading");

    try {
      const { analyze } = await import("@coding-bible/analyzer");
      setResult(analyze({ language, source }));
      setStatus("idle");
    } catch (error: unknown) {
      console.error("Coding Bible analyzer failed to load.", error);
      setResult(null);
      setStatus("error");
    }
  };

  const loadExample = () => {
    setLanguage("tsx");
    setSource(sampleSource);
    resetResult();
  };

  return (
    <section aria-labelledby="analyzer-heading" className={styles.analyzer}>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.kicker}>AST analyzer · local only</p>
          <h2 id="analyzer-heading">Paste code. Find the rule.</h2>
          <p className={styles.description}>
            The analyzer runs focused source-local checks in your browser. Your
            source stays on this page and is not uploaded anywhere.
          </p>
        </div>
        <button
          className={styles.sampleButton}
          onClick={loadExample}
          type="button"
        >
          Load example
        </button>
      </div>

      <div className={styles.workspace}>
        <section className={styles.editorPanel}>
          <div className={styles.toolbar}>
            <label className={styles.languageLabel} htmlFor="analyzer-language">
              Language
            </label>
            <select
              className={styles.languageSelect}
              id="analyzer-language"
              onChange={(event) => {
                const nextLanguage = event.target.value;
                if (!isAnalyzerLanguage(nextLanguage)) {
                  return;
                }

                setLanguage(nextLanguage);
                resetResult();
              }}
              value={language}
            >
              {languageOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <span className={styles.toolbarSpacer} />
            <span className={styles.localBadge}>Runs locally</span>
          </div>

          <label className={styles.visuallyHidden} htmlFor="analyzer-source">
            Source code to analyze
          </label>
          <textarea
            autoCapitalize="off"
            autoComplete="off"
            className={styles.editor}
            id="analyzer-source"
            onChange={(event) => {
              setSource(event.target.value);
              resetResult();
            }}
            placeholder="Paste TypeScript, TSX, JavaScript, or JSX here…"
            spellCheck={false}
            value={source}
          />

          <div className={styles.actions}>
            <p className={styles.hint}>
              Automated subset only: a DON'T example flags when that rule is
              currently implemented. No architecture fortune-telling.
            </p>
            <button
              className={styles.analyzeButton}
              disabled={!source.trim() || status === "loading"}
              onClick={handleAnalyze}
              type="button"
            >
              {status === "loading" ? "Loading analyzer…" : "Analyze code"}
            </button>
          </div>
        </section>

        <section aria-live="polite" className={styles.resultsPanel}>
          {!result && status !== "error" ? (
            <div className={styles.emptyState}>
              <span className={styles.prompt}>&gt;_</span>
              <h3>Ready when you are.</h3>
              <p>
                Paste a snippet or load the example. Findings link straight back
                to the rule that explains the fix.
              </p>
            </div>
          ) : null}

          {status === "error" ? (
            <div className={styles.errorState} role="alert">
              <h3>Analyzer failed to load.</h3>
              <p>Refresh the page and try again.</p>
            </div>
          ) : null}

          {result ? (
            <>
              <div className={styles.resultSummary}>
                <div>
                  <strong>
                    {result.diagnostics.length || result.findings.length}
                  </strong>
                  <span>
                    {result.diagnostics.length
                      ? result.diagnostics.length === 1
                        ? " syntax issue"
                        : " syntax issues"
                      : result.findings.length === 1
                        ? " finding"
                        : " findings"}
                  </span>
                </div>
                <span>
                  {result.diagnostics.length
                    ? "rule checks paused"
                    : `${result.checksRun} checks · ${result.ruleIdsChecked.length} rules`}
                </span>
              </div>

              {result.diagnostics.length ? (
                <div className={styles.findings}>
                  {result.diagnostics.map((diagnostic) => (
                    <DiagnosticCard
                      diagnostic={diagnostic}
                      key={[
                        diagnostic.location.line,
                        diagnostic.location.column,
                        diagnostic.message,
                      ].join("-")}
                    />
                  ))}
                </div>
              ) : !result.findings.length ? (
                <div className={styles.cleanState}>
                  <h3>No supported violations found.</h3>
                  <p>
                    Clean for {result.ruleIdsChecked.length} applicable
                    automated rules out of {rules.length}. The rest still
                    requires the Bible—or a code review.
                  </p>
                </div>
              ) : (
                <div className={styles.findings}>
                  {result.findings.map((finding) => (
                    <FindingCard
                      finding={finding}
                      key={[
                        finding.detectorId,
                        finding.location.line,
                        finding.location.column,
                      ].join("-")}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      </div>
    </section>
  );
};
