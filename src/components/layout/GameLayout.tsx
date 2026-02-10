import type { ReactNode } from 'react';
import styles from './GameLayout.module.css';

interface GameLayoutProps {
  title?: string;
  onBack?: () => void;
  /** When true the layout is clamped to 100% viewport height (no scroll). */
  fit?: boolean;
  children: ReactNode;
}

export default function GameLayout({ title, onBack, fit, children }: GameLayoutProps) {
  return (
    <div className={`${styles.layout} ${fit ? styles.fit : ''}`}>
      {(title || onBack) && (
        <div className={styles.header}>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack} aria-label="Retour">
              ←
            </button>
          )}
          {title && <span className={styles.title}>{title}</span>}
        </div>
      )}
      <div className={`${styles.content} screen-enter`}>{children}</div>
    </div>
  );
}
