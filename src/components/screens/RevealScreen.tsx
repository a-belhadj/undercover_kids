import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import PlayerAvatar from '../ui/PlayerAvatar';
import EmojiCard from '../ui/EmojiCard';
import styles from './RevealScreen.module.css';

export default function RevealScreen() {
  const { players, currentPlayerIndex, nextReveal, easyMode } = useGameStore();
  const [revealed, setRevealed] = useState(false);

  const player = players[currentPlayerIndex];

  // Reset scroll when entering this screen or switching player
  useEffect(() => {
    document.getElementById('root')?.scrollTo(0, 0);
  }, [currentPlayerIndex]);

  const handleReveal = () => setRevealed(true);
  const handleNext = () => {
    setRevealed(false);
    nextReveal();
  };

  return (
    <GameLayout title={`Joueur ${currentPlayerIndex + 1}/${players.length}`} fit>
      <div className={styles.center}>
        <PlayerAvatar
          emoji={player.avatarEmoji}
          color={player.avatarColor}
          size="large"
        />
      </div>

      <div className={styles.playerName}>{player.name}</div>

      {!revealed ? (
        <>
          <div className={styles.instruction}>
            Retourne le téléphone vers toi 🤫
          </div>
          <div className={styles.hidden}>👀</div>
          <Button variant="primary" size="large" icon="👁️" onClick={handleReveal}>
            Voir mon image
          </Button>
        </>
      ) : (
        <>
          {player.role === 'mrwhite' ? (
            <>
              <div className={styles.emojiDisplay}>
                <EmojiCard emoji="❓" large mystery />
              </div>
              <span className={`${styles.roleTag} ${styles.mrwhite}`}>
                Tu es Mr. White ! Bluff ! 🎩
              </span>
            </>
          ) : (
            <>
              <div className={`${styles.emojiDisplay} emoji-reveal`}>
                <EmojiCard emoji={player.emoji!} large />
              </div>
              {player.emojiLabel && (
                <div className={styles.emojiLabel}>{player.emojiLabel}</div>
              )}
              <span
                className={`${styles.roleTag} ${
                  easyMode
                    ? player.role === 'civil' ? styles.civil : styles.undercover
                    : styles.neutral
                }`}
              >
                {easyMode
                  ? player.role === 'civil'
                    ? 'Tu es Civil ! 🟢'
                    : 'Tu es Undercover ! 🥷'
                  : 'Mémorise bien ton image !'}
              </span>
            </>
          )}
          <Button variant="success" size="large" icon="✅" onClick={handleNext}>
            J'ai vu !
          </Button>
        </>
      )}
    </GameLayout>
  );
}
