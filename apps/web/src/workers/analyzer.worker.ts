import { typescriptLibs } from "virtual:coding-bible-typescript-libs";

import { analyzeBrowserInput } from "../analyzer/analyzeBrowserInput";
import type {
  BrowserAnalyzerRequest,
  BrowserAnalyzerResponse,
} from "../analyzer/types";

const send = (response: BrowserAnalyzerResponse) => {
  self.postMessage(response);
};

self.addEventListener(
  "message",
  (event: MessageEvent<BrowserAnalyzerRequest>) => {
    const request = event.data;
    if (request.type !== "analyze") {
      return;
    }

    try {
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
