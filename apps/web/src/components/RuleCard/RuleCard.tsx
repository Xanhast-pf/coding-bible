import type { CodingRule } from "@coding-bible/rules";

import styles from "./RuleCard.module.css";

interface RuleCardProps {
  rule: CodingRule;
}

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
      </div>

      <h2 className={styles.title}>{rule.title}</h2>
      <p className={styles.summary}>{rule.summary}</p>

      <section>
        <h3>Why</h3>
        <p>{rule.rationale}</p>
      </section>

      {rule.good && rule.bad ? (
        <div className={styles.examples}>
          <section>
            <h3>Do</h3>
            <pre>
              <code>{rule.good.code}</code>
            </pre>
          </section>

          <section>
            <h3>Don&apos;t</h3>
            <pre>
              <code>{rule.bad.code}</code>
            </pre>
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
    </article>
  );
};
