import { useEffect, useRef, useState } from "react";

import styles from "./CopyButton.module.css";

interface CopyButtonProps {
  label: string;
  value: string;
}

type CopyStatus = "copied" | "error" | "idle";

const COPY_FEEDBACK_DURATION_MS = 1400;

const copyFeedbackByStatus: Record<CopyStatus, string | null> = {
  copied: "Copied",
  error: "Copy failed",
  idle: null,
};

export const CopyButton = ({ label, value }: CopyButtonProps) => {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeout.current !== null) {
        window.clearTimeout(resetTimeout.current);
      }
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimeout.current !== null) {
      window.clearTimeout(resetTimeout.current);
    }

    resetTimeout.current = window.setTimeout(() => {
      setStatus("idle");
      resetTimeout.current = null;
    }, COPY_FEEDBACK_DURATION_MS);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }

    scheduleReset();
  };

  return (
    <button
      className={styles.button}
      data-status={status}
      onClick={handleCopy}
      type="button"
    >
      <span aria-atomic="true" aria-live="polite">
        {copyFeedbackByStatus[status] ?? label}
      </span>
    </button>
  );
};
