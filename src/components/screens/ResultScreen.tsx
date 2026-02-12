import { useGameStore } from '../../store/gameStore';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import PlayerAvatar from '../ui/PlayerAvatar';
import EmojiCard from '../ui/EmojiCard';
import styles from './ResultScreen.module.css';

const ROLE_LABELS: Record<string, string> = {
  civil: 'Civil',
  undercover: 'Undercover',
  mrwhite: 'Mr. White',
};

export default function ResultScreen() {
  const { players, winner, pairDisplayMode, restartWithSamePlayers, goHome } = useGameStore();

  const isCivilWin = winner === 'civil';

  return (
    <GameLayout title="Fin de partie">
      <div className={styles.banner}>
        {isCivilWin ? '🎉' : '🕵️'}
      </div>

      <div className={`${styles.title} ${isCivilWin ? styles.titleCivil : styles.titleIntrus}`}>
        {isCivilWin ? 'Les Civils ont gagné !' : 'Les Intrus ont gagné !'}
      </div>

      <div className={styles.subtitle}>
        {isCivilWin
          ? 'Tous les intrus ont été démasqués !'
          : 'Les intrus ont réussi à se cacher...'}
      </div>

      <div className={styles.playerList}>
        {players.map((p) => (
          <div
            key={p.id}
            className={styles.playerRow}
            data-role={p.role}
          >
            <PlayerAvatar
              emoji={p.avatarEmoji}
              color={p.avatarColor}
              size="small"
            />
            <span className={`${styles.playerName} ${p.eliminated ? styles.nameEliminated : ''}`}>
              {p.name}
            </span>
            <span className={`${styles.roleLabel} ${styles[`role_${p.role}`]}`}>
              {ROLE_LABELS[p.role]}
            </span>
            {p.role === 'mrwhite' ? (
              <span className={styles.mystery}>❓</span>
            ) : (
              <div className={styles.cardEmoji}>
                {pairDisplayMode !== 'text' && <EmojiCard emoji={p.emoji!} />}
                {pairDisplayMode !== 'icon' && p.emojiLabel && (
                  <span className={styles.cardLabel}>{p.emojiLabel}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="large" block icon="🔄" onClick={restartWithSamePlayers}>
          Rejouer
        </Button>
        <Button variant="secondary" block icon="🏠" onClick={goHome}>
          Nouveau jeu
        </Button>
      </div>
    </GameLayout>
  );
}
