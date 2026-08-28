import styles from "./AppNavigation.module.css";

export type AppView = "analyze" | "learn";

interface AppNavigationProps {
  activeView: AppView;
}

export const AppNavigation = ({ activeView }: AppNavigationProps) => (
  <nav aria-label="Coding Bible" className={styles.nav}>
    <a
      aria-current={activeView === "learn" ? "page" : undefined}
      className={styles.link}
      data-active={activeView === "learn"}
      href="./"
    >
      Learn
    </a>
    <a
      aria-current={activeView === "analyze" ? "page" : undefined}
      className={styles.link}
      data-active={activeView === "analyze"}
      href="?view=analyze"
    >
      Analyze
      <span className={styles.badge}>Beta</span>
    </a>
  </nav>
);
