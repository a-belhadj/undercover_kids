import { isImageUrl } from '../../lib/isImageUrl';
import { cn } from '../../lib/cn';
import styles from './EmojiCard.module.css';

interface EmojiCardProps {
  emoji: string;
  large?: boolean;
  selectable?: boolean;
  selected?: boolean;
  mystery?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function EmojiCard({
  emoji,
  large = false,
  selectable = false,
  selected = false,
  mystery = false,
  className = '',
  onClick,
}: EmojiCardProps) {
  const classes = cn(
    styles.card,
    large && styles.large,
    selectable && styles.selectable,
    selected && styles.selected,
    mystery && styles.mystery,
    className,
  );

  return (
    <div
      className={classes}
      onClick={onClick}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      aria-label={mystery ? 'Mystère' : emoji}
    >
      {isImageUrl(emoji) ? (
        <img
          src={emoji}
          alt="hero"
          className={styles.image}
          draggable={false}
        />
      ) : (
        <span className={styles.emoji}>{emoji}</span>
      )}
    </div>
  );
}
