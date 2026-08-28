import { useEffect, useRef, useState } from "react";

import styles from "./CopyButton.module.css";

interface CopyButtonProps {
  accessibleLabel?: string;
  label: string;
  value: string | (() => string);
  variant?: "accent" | "default";
}

type CopyStatus = "copied" | "error" | "idle";

const COPY_FEEDBACK_DURATION_MS = 1400;

const copyFeedbackByStatus: Record<CopyStatus, string | null> = {
  copied: "Copied",
  error: "Copy failed",
  idle: null,
};

export const CopyButton = ({
  accessibleLabel,
  label,
  value,
  variant = "default",
}: CopyButtonProps) => {
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
      const copyValue = typeof value === "function" ? value() : value;
      await navigator.clipboard.writeText(copyValue);
      setStatus("copied");
    } catch {
      setStatus("error");
    }

    scheduleReset();
  };

  return (
    <button
      aria-label={accessibleLabel}
      className={styles.button}
      data-status={status}
      data-variant={variant}
      onClick={handleCopy}
      title={accessibleLabel}
      type="button"
    >
      <span aria-atomic="true" aria-live="polite">
        {copyFeedbackByStatus[status] ?? label}
      </span>
    </button>
  );
};
