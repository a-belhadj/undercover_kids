import type { Role, PairDisplayMode } from '../../types/game';
import EmojiCard from './EmojiCard';
import styles from './PlayerCardReveal.module.css';

interface PlayerCardRevealProps {
  role: Role;
  emoji: string | null;
  emojiLabel: string | null;
  easyMode: boolean;
  pairDisplayMode: PairDisplayMode;
}

export default function PlayerCardReveal({ role, emoji, emojiLabel, easyMode, pairDisplayMode }: PlayerCardRevealProps) {
  if (role === 'mrwhite') {
    return (
      <>
        <div className={styles.emojiDisplay}>
          <EmojiCard emoji="❓" large mystery />
        </div>
        <span className={`${styles.roleTag} ${styles.mrwhite}`}>
          Tu es Mr. White ! Bluff ! 🎩
        </span>
      </>
    );
  }

  return (
    <>
      {pairDisplayMode !== 'text' && (
        <div className={`${styles.emojiDisplay} emoji-reveal`}>
          <EmojiCard emoji={emoji!} large />
        </div>
      )}
      {pairDisplayMode !== 'icon' && emojiLabel && (
        <div className={styles.emojiLabel}>{emojiLabel}</div>
      )}
      <span
        className={`${styles.roleTag} ${
          easyMode
            ? role === 'civil' ? styles.civil : styles.undercover
            : styles.neutral
        }`}
      >
        {easyMode
          ? role === 'civil'
            ? 'Tu es Civil ! 🟢'
            : 'Tu es Undercover ! 🥷'
          : 'Mémorise bien ton image !'}
      </span>
    </>
  );
}
