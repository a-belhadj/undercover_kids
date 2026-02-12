import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import PlayerAvatar from '../ui/PlayerAvatar';
import PlayerCardReveal from '../ui/PlayerCardReveal';
import styles from './RevealScreen.module.css';

export default function RevealScreen() {
  const { players, currentPlayerIndex, nextReveal, easyMode, pairDisplayMode, disableCurrentPairAndRestart } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const player = players[currentPlayerIndex];

  // Reset scroll when entering this screen or switching player
  useEffect(() => {
    document.getElementById('root')?.scrollTo(0, 0);
  }, [currentPlayerIndex]);

  const handleReveal = () => setRevealed(true);
  const handleNext = () => {
    setRevealed(false);
    setConfirmDisable(false);
    nextReveal();
  };

  const handleDisable = () => {
    if (!confirmDisable) {
      setConfirmDisable(true);
      return;
    }
    disableCurrentPairAndRestart();
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
          <PlayerCardReveal
            role={player.role}
            emoji={player.emoji}
            emojiLabel={player.emojiLabel}
            easyMode={easyMode}
            pairDisplayMode={pairDisplayMode}
          />
          <Button variant="success" size="large" icon="✅" onClick={handleNext}>
            J'ai vu !
          </Button>
          {player.role !== 'mrwhite' && (
            <Button
              variant={confirmDisable ? 'danger' : 'secondary'}
              icon={confirmDisable ? '⚠️' : '🚫'}
              onClick={handleDisable}
              style={{ marginTop: '0.5rem', opacity: confirmDisable ? 1 : 0.7 }}
            >
              {confirmDisable ? 'Confirmer ? La paire sera désactivée' : 'Trop difficile, changer'}
            </Button>
          )}
        </>
      )}
    </GameLayout>
  );
}
