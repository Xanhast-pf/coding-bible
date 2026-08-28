import { rulePackLabels } from "@coding-bible/rules";
import type { CodingRule } from "@coding-bible/rules";

import { CodeSnippet } from "../CodeSnippet/CodeSnippet";
import { CopyButton } from "../CopyButton/CopyButton";
import styles from "./RuleCard.module.css";

interface RuleCardProps {
  rule: CodingRule;
}

const getRuleUrl = (ruleId: string) => {
  const url = new URL(window.location.href);
  url.hash = ruleId;

  return url.toString();
};

export const RuleCard = ({ rule }: RuleCardProps) => {
  return (
    <article className={styles.card} id={rule.id}>
      <div className={styles.meta}>
        <a className={styles.ruleId} href={`#${rule.id}`}>
          {rule.id}
        </a>

        <span className={styles.level} data-level={rule.level}>
          {rule.level}
        </span>

        <span className={styles.pack}>{rulePackLabels[rule.pack]}</span>

        <span className={styles.metaSpacer} />

        <CopyButton label="Copy link" value={getRuleUrl(rule.id)} />
      </div>

      <h2 className={styles.title}>{rule.title}</h2>
      <p className={styles.summary}>{rule.summary}</p>

      <section>
        <h3>Why</h3>
        <p>{rule.rationale}</p>
      </section>

      {rule.good && rule.bad ? (
        <div className={styles.examples}>
          <section className={styles.example} data-tone="good">
            <h3 className={styles.exampleTitle}>Do</h3>
            <CodeSnippet
              code={rule.good.code}
              language={rule.good.language}
              tone="good"
            />
          </section>

          <section className={styles.example} data-tone="bad">
            <h3 className={styles.exampleTitle}>Don&apos;t</h3>
            <CodeSnippet
              code={rule.bad.code}
              language={rule.bad.language}
              tone="bad"
            />
          </section>
        </div>
      ) : null}

      {rule.exceptions?.length ? (
        <section>
          <h3>Exceptions</h3>
          <ul>
            {rule.exceptions.map((exception) => (
              <li key={exception}>{exception}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {rule.references?.length ? (
        <section>
          <h3>References</h3>
          <ul className={styles.references}>
            {rule.references.map((reference) => (
              <li key={reference.url}>
                <a href={reference.url} rel="noreferrer" target="_blank">
                  {reference.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
};
