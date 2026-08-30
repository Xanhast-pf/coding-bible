import { useRef } from "react";

import type { BrowserProjectSelection } from "../../analyzer/projectSelection";
import { formatByteSize } from "../../analyzer/projectSelection";
import styles from "./AnalyzeView.module.css";

interface ProjectPickerProps {
  disabled: boolean;
  errorMessage: string | null;
  onFilesSelected: (files: FileList) => void;
  selection: BrowserProjectSelection | null;
}

export const ProjectPicker = ({
  disabled,
  errorMessage,
  onFilesSelected,
  selection,
}: ProjectPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const compilerConfig = selection
    ? selection.tsconfigFileNames.length === 0
      ? "Browser defaults"
      : selection.tsconfigFileNames.length === 1
        ? selection.tsconfigFileNames[0]
        : `${selection.tsconfigFileNames.length} tsconfig projects`
    : "Browser defaults";

  return (
    <div className={styles.projectPicker}>
      <input
        className={styles.visuallyHidden}
        disabled={disabled}
        id="analyzer-project-folder"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) {
            onFilesSelected(event.target.files);
          }
        }}
        ref={(input) => {
          inputRef.current = input;
          input?.setAttribute("webkitdirectory", "");
          input?.setAttribute("directory", "");
        }}
        type="file"
      />

      <div className={styles.projectDropZone}>
        <span className={styles.projectIcon} aria-hidden="true">
          ./
        </span>
        <h3>{selection ? selection.projectName : "Select a local project"}</h3>
        <p>
          {selection
            ? `${selection.sourceFileCount} source files · ${formatByteSize(selection.totalBytes)}`
            : "Choose a folder with your source and tsconfig. Files stay in this browser tab."}
        </p>
        <button
          className={styles.sampleButton}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {selection ? "Choose another folder" : "Choose project folder"}
        </button>
      </div>

      {selection ? (
        <dl className={styles.projectFacts}>
          <div>
            <dt>Compiler config</dt>
            <dd>{compilerConfig}</dd>
          </div>
          <div>
            <dt>Local files</dt>
            <dd>{selection.files.length}</dd>
          </div>
          <div>
            <dt>Ignored</dt>
            <dd>{selection.ignoredFileCount}</dd>
          </div>
        </dl>
      ) : null}

      {errorMessage ? (
        <p className={styles.projectError} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <p className={styles.projectPrivacy}>
        <strong>Private by construction.</strong> Generated/vendor directories
        are skipped, and your source is never uploaded to Coding Bible.
      </p>
    </div>
  );
};
