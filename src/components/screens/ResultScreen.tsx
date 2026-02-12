import { useMemo } from 'react';
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
  const { players, winner, pairDisplayMode, cheatLog, restartWithSamePlayers, goHome } = useGameStore();

  const isCivilWin = winner === 'civil';

  const cheatSummary = useMemo(() => {
    const { peekCounts, showAllCount } = cheatLog;
    const peeks = players
      .map((p, i) => ({ player: p, count: peekCounts[i] || 0 }))
      .filter((e) => e.count > 0);
    const hasCheat = peeks.length > 0 || showAllCount > 0;
    return { peeks, showAllCount, hasCheat };
  }, [cheatLog, players]);

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

      {/* Cheat summary */}
      <div className={styles.cheatSection}>
        <div className={styles.cheatTitle}>Bilan anti-triche</div>
        {!cheatSummary.hasCheat ? (
          <div className={styles.cheatClean}>Aucune carte consultée pendant la partie</div>
        ) : (
          <div className={styles.cheatDetails}>
            {cheatSummary.showAllCount > 0 && (
              <div className={styles.cheatRow}>
                <span className={styles.cheatIcon}>👀</span>
                <span>Toutes les cartes révélées <strong>{cheatSummary.showAllCount} fois</strong></span>
              </div>
            )}
            {cheatSummary.peeks.map((e) => (
              <div key={e.player.id} className={styles.cheatRow}>
                <span className={styles.cheatIcon}>👁️</span>
                <PlayerAvatar
                  emoji={e.player.avatarEmoji}
                  color={e.player.avatarColor}
                  size="small"
                />
                <span><strong>{e.player.name}</strong> a revu sa carte <strong>{e.count} fois</strong></span>
              </div>
            ))}
          </div>
        )}
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
