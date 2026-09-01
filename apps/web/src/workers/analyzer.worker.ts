import { typescriptLibs } from "virtual:coding-bible-typescript-libs";

import { analyzeBrowserInput } from "../analyzer/analyzeBrowserInput";
import { getBrowserAnalyzerRuntimeIntegrityError } from "../analyzer/runtimeIntegrity";
import type {
  BrowserAnalyzerRequest,
  BrowserAnalyzerResponse,
} from "../analyzer/types";

const send = (response: BrowserAnalyzerResponse) => {
  self.postMessage(response);
};

const runtimeIntegrityError = getBrowserAnalyzerRuntimeIntegrityError();

self.addEventListener(
  "message",
  (event: MessageEvent<BrowserAnalyzerRequest>) => {
    const request = event.data;
    if (request.type !== "analyze") {
      return;
    }

    try {
      if (runtimeIntegrityError) {
        throw new Error(runtimeIntegrityError);
      }

      const result = analyzeBrowserInput(
        request.input,
        typescriptLibs,
        (progress) => {
          send({ id: request.id, progress, type: "progress" });
        },
      );
      send({ id: request.id, result, type: "result" });
    } catch (error: unknown) {
      send({
        id: request.id,
        message:
          error instanceof Error ? error.message : "Unknown analyzer error.",
        type: "error",
      });
    }
  },
);
