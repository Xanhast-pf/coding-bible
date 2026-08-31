import type { AnalyzerLanguage } from "@coding-bible/analyzer";
import { useEffect, useRef, useState } from "react";

import type { BrowserAnalysisTask } from "../../analyzer/runBrowserAnalysis";
import { runBrowserAnalysis } from "../../analyzer/runBrowserAnalysis";
import type { BrowserProjectSelection } from "../../analyzer/projectSelection";
import { readProjectSelection } from "../../analyzer/projectSelection";
import type {
  BrowserAnalyzeInput,
  BrowserAnalyzerMode,
  BrowserAnalyzerProgress,
  BrowserAnalyzeResult,
} from "../../analyzer/types";
import { AnalysisResults } from "./AnalysisResults";
import styles from "./AnalyzeView.module.css";
import { ProjectPicker } from "./ProjectPicker";
import { ReviewWorkspace } from "./ReviewWorkspace";

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

const isAnalyzerLanguage = (value: string): value is AnalyzerLanguage =>
  languageOptions.some(([language]) => language === value);

const snippetFileNameByLanguage = {
  js: "snippet.js",
  jsx: "snippet.jsx",
  ts: "snippet.ts",
  tsx: "snippet.tsx",
} satisfies Record<AnalyzerLanguage, string>;

type AnalyzerStatus = "idle" | "reading" | "analyzing";

export const AnalyzeView = () => {
  const [mode, setMode] = useState<BrowserAnalyzerMode>("snippet");
  const [language, setLanguage] = useState<AnalyzerLanguage>("tsx");
  const [source, setSource] = useState("");
  const [project, setProject] = useState<BrowserProjectSelection | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [result, setResult] = useState<BrowserAnalyzeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<BrowserAnalyzerProgress | null>(
    null,
  );
  const [status, setStatus] = useState<AnalyzerStatus>("idle");
  const activeTaskRef = useRef<BrowserAnalysisTask | null>(null);

  useEffect(
    () => () => {
      activeTaskRef.current?.cancel();
    },
    [],
  );

  const resetResult = () => {
    setResult(null);
    setErrorMessage(null);
    setProgress(null);
  };

  const cancelAnalysis = () => {
    activeTaskRef.current?.cancel();
    activeTaskRef.current = null;
    setStatus("idle");
    setProgress(null);
  };

  const switchMode = (nextMode: BrowserAnalyzerMode) => {
    if (nextMode === mode) {
      return;
    }

    cancelAnalysis();
    setMode(nextMode);
    resetResult();
  };

  const runAnalysis = async (input: BrowserAnalyzeInput) => {
    if (status !== "idle") {
      return;
    }

    resetResult();
    setStatus("analyzing");
    setProgress({
      message: "Loading TypeScript analyzer worker…",
      phase: "preparing",
    });

    const task = runBrowserAnalysis(input, setProgress);
    activeTaskRef.current = task;

    try {
      const nextResult = await task.result;
      setResult(nextResult);
    } catch (error: unknown) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Coding Bible browser analyzer failed.", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Analyzer failed to run.",
        );
      }
    } finally {
      if (activeTaskRef.current === task) {
        activeTaskRef.current = null;
        setStatus("idle");
        setProgress(null);
      }
    }
  };

  const handleAnalyze = async () => {
    const input =
      mode === "snippet"
        ? source.trim()
          ? {
              files: [
                {
                  fileName: snippetFileNameByLanguage[language],
                  source,
                },
              ],
              mode,
            }
          : null
        : project
          ? {
              files: project.files,
              mode,
            }
          : null;

    if (!input) {
      return;
    }

    await runAnalysis(input);
  };

  const handleApplySnippetFix = (nextSource: string) => {
    if (mode !== "snippet" || status !== "idle") {
      return;
    }

    setSource(nextSource);
    void runAnalysis({
      files: [
        {
          fileName: snippetFileNameByLanguage[language],
          source: nextSource,
        },
      ],
      mode: "snippet",
    });
  };

  const handleProjectFiles = async (files: FileList) => {
    cancelAnalysis();
    resetResult();
    setProjectError(null);
    setStatus("reading");

    try {
      setProject(await readProjectSelection(files));
    } catch (error: unknown) {
      setProject(null);
      setProjectError(
        error instanceof Error ? error.message : "Could not read that project.",
      );
    } finally {
      setStatus("idle");
    }
  };

  const loadExample = () => {
    cancelAnalysis();
    setMode("snippet");
    setLanguage("tsx");
    setSource(sampleSource);
    resetResult();
  };

  const canAnalyze =
    status === "idle" &&
    (mode === "snippet" ? Boolean(source.trim()) : Boolean(project));
  const analysisFiles =
    mode === "snippet"
      ? [
          {
            fileName: snippetFileNameByLanguage[language],
            source,
          },
        ]
      : (project?.files ?? []);

  return (
    <section aria-labelledby="analyzer-heading" className={styles.analyzer}>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.kicker}>Project-aware analyzer · local only</p>
          <h2 id="analyzer-heading">Give the analyzer real context.</h2>
          <p className={styles.description}>
            Snippets and local projects now run through a real TypeScript
            program in a Web Worker. Cross-file symbols, compiler options, and
            standard libraries stay available without uploading your source.
          </p>
        </div>
        <button
          className={styles.sampleButton}
          disabled={status !== "idle"}
          onClick={loadExample}
          type="button"
        >
          Load example
        </button>
      </div>

      <div className={styles.modeTabs} role="group" aria-label="Analysis mode">
        <button
          aria-pressed={mode === "snippet"}
          className={styles.modeTab}
          onClick={() => switchMode("snippet")}
          type="button"
        >
          Snippet
          <span>Fast virtual project</span>
        </button>
        <button
          aria-pressed={mode === "project"}
          className={styles.modeTab}
          onClick={() => switchMode("project")}
          type="button"
        >
          Project
          <span>Folder + tsconfig context</span>
        </button>
      </div>

      <div className={styles.workspace}>
        <section className={styles.editorPanel}>
          <div className={styles.toolbar}>
            {mode === "snippet" ? (
              <>
                <label
                  className={styles.languageLabel}
                  htmlFor="analyzer-language"
                >
                  Language
                </label>
                <select
                  className={styles.languageSelect}
                  disabled={status !== "idle"}
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
              </>
            ) : (
              <span className={styles.languageLabel}>Local project</span>
            )}
            <span className={styles.toolbarSpacer} />
            <span className={styles.localBadge}>Web Worker · no upload</span>
          </div>

          {mode === "snippet" ? (
            <>
              <label
                className={styles.visuallyHidden}
                htmlFor="analyzer-source"
              >
                Source code to analyze
              </label>
              <textarea
                autoCapitalize="off"
                autoComplete="off"
                className={styles.editor}
                disabled={status !== "idle"}
                id="analyzer-source"
                onChange={(event) => {
                  setSource(event.target.value);
                  resetResult();
                }}
                placeholder="Paste TypeScript, TSX, JavaScript, or JSX here…"
                spellCheck={false}
                value={source}
              />
            </>
          ) : (
            <ProjectPicker
              disabled={status !== "idle"}
              errorMessage={projectError}
              onFilesSelected={handleProjectFiles}
              selection={project}
            />
          )}

          {progress ? (
            <div className={styles.progress} role="status">
              <span className={styles.progressPulse} aria-hidden="true" />
              <span>{progress.message}</span>
              {progress.total && progress.completed !== undefined ? (
                <span className={styles.progressCount}>
                  {Math.min(progress.completed + 1, progress.total)}/
                  {progress.total}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className={styles.actions}>
            <p className={styles.hint}>
              {mode === "snippet"
                ? "Real TypeScript standard libraries; imports without matching local files remain unresolved."
                : "Uses selected files, tsconfig options, and coding-bible.config.json when present; generated/vendor folders are skipped."}
            </p>
            <div className={styles.actionButtons}>
              {status === "analyzing" ? (
                <button
                  className={styles.cancelButton}
                  onClick={cancelAnalysis}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
              <button
                className={styles.analyzeButton}
                disabled={!canAnalyze}
                onClick={handleAnalyze}
                type="button"
              >
                {status === "reading"
                  ? "Reading project…"
                  : status === "analyzing"
                    ? "Analyzing…"
                    : mode === "project"
                      ? "Analyze project"
                      : "Analyze code"}
              </button>
            </div>
          </div>
        </section>

        <section aria-live="polite" className={styles.resultsPanel}>
          <AnalysisResults
            errorMessage={errorMessage}
            files={analysisFiles}
            onApplySnippetFix={handleApplySnippetFix}
            {...(project?.projectName
              ? { projectName: project.projectName }
              : {})}
            result={result}
          />
        </section>
      </div>

      {result ? (
        <ReviewWorkspace
          files={analysisFiles}
          onApplySnippetFix={handleApplySnippetFix}
          result={result}
        />
      ) : null}
    </section>
  );
};
