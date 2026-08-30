import type {
  BrowserAnalyzeInput,
  BrowserAnalyzeResult,
  BrowserAnalyzerProgress,
  BrowserAnalyzerRequest,
  BrowserAnalyzerResponse,
} from "./types";

export interface BrowserAnalysisTask {
  cancel: () => void;
  result: Promise<BrowserAnalyzeResult>;
}

let nextRequestId = 1;

export const runBrowserAnalysis = (
  input: BrowserAnalyzeInput,
  onProgress: (progress: BrowserAnalyzerProgress) => void,
): BrowserAnalysisTask => {
  const worker = new Worker(
    new URL("../workers/analyzer.worker.ts", import.meta.url),
    { type: "module" },
  );
  const id = nextRequestId;
  nextRequestId += 1;

  let settled = false;
  let rejectTask: ((reason?: unknown) => void) | null = null;

  const dispose = () => {
    worker.terminate();
  };

  const result = new Promise<BrowserAnalyzeResult>((resolve, reject) => {
    rejectTask = reject;

    worker.addEventListener(
      "message",
      (event: MessageEvent<BrowserAnalyzerResponse>) => {
        const response = event.data;
        if (response.id !== id) {
          return;
        }

        if (response.type === "progress") {
          onProgress(response.progress);
          return;
        }

        settled = true;
        dispose();

        if (response.type === "result") {
          resolve(response.result);
          return;
        }

        reject(new Error(response.message));
      },
    );

    worker.addEventListener("error", (event) => {
      if (settled) {
        return;
      }

      settled = true;
      dispose();
      reject(new Error(event.message || "Analyzer worker failed to load."));
    });

    const request: BrowserAnalyzerRequest = {
      id,
      input,
      type: "analyze",
    };
    worker.postMessage(request);
  });

  return {
    cancel: () => {
      if (settled) {
        return;
      }

      settled = true;
      dispose();
      rejectTask?.(new DOMException("Analysis cancelled.", "AbortError"));
    },
    result,
  };
};
