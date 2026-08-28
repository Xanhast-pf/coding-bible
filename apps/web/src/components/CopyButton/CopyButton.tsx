import { useState } from "react";

import styles from "./CopyButton.module.css";

interface CopyButtonProps {
  label: string;
  value: string;
}

const COPY_FEEDBACK_DURATION_MS = 1400;

export const CopyButton = ({ label, value }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);

    window.setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <button
      className={styles.button}
      data-copied={copied}
      onClick={handleCopy}
      type="button"
    >
      {copied ? "Copied" : label}
    </button>
  );
};
