import styles from './PlayerAvatar.module.css';
import { isImageUrl } from '../../lib/isImageUrl';
import { cn } from '../../lib/cn';

/** Renders an emoji character or an <img> if the value is a URL. */
export function AvatarEmoji({ value, size = 20 }: { value: string; size?: number }) {
  if (isImageUrl(value)) {
    return <img src={value} alt="avatar" style={{ width: size, height: size, objectFit: 'contain', verticalAlign: 'middle' }} draggable={false} />;
  }
  return <>{value}</>;
}

interface PlayerAvatarProps {
  emoji: string;
  color: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  highlighted?: boolean;
  onClick?: () => void;
}

export default function PlayerAvatar({
  emoji,
  color,
  name,
  size = 'medium',
  highlighted = false,
  onClick,
}: PlayerAvatarProps) {
  const classes = cn(
    styles.avatar,
    styles[size],
    highlighted && 'highlight-ring',
  );

  const avatar = (
    <div
      className={classes}
      style={{ backgroundColor: color }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={name ?? emoji}
    >
      {isImageUrl(emoji) ? (
        <img src={emoji} alt="avatar" className={styles.avatarImg} draggable={false} />
      ) : (
        emoji
      )}
    </div>
  );

  if (!name) return avatar;

  return (
    <div className={styles.nameTag} onClick={onClick}>
      {avatar}
      <span className={styles.nameText}>{name}</span>
    </div>
  );
}
