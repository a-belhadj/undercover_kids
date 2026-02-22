import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import PlayerAvatar from '../ui/PlayerAvatar';
import PlayerCardReveal from '../ui/PlayerCardReveal';
import ConfirmOverlay from '../ui/ConfirmOverlay';
import styles from './RevealScreen.module.css';

/** Inner component — remounted via key when player/pair changes, resetting local state */
function RevealCard() {
  const { players, currentPlayerIndex, nextReveal, easyMode, pairDisplayMode, disableCurrentPairAndRestart, setPhase, goHome } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmNav, setConfirmNav] = useState<'setup' | 'home' | null>(null);

  const player = players[currentPlayerIndex];

  useScrollToTop();

  const handleReveal = () => setRevealed(true);
  const handleNext = () => {
    nextReveal();
  };

  return (
    <GameLayout
      title={`Joueur ${currentPlayerIndex + 1}/${players.length}`}
      onBack={() => setConfirmNav('setup')}
      fit
    >
      {/* Home button — top-right corner */}
      <button
        className={styles.homeBtn}
        onClick={() => setConfirmNav('home')}
        aria-label="Accueil"
      >
        🏠
      </button>

      {/* Disable pair — small icon next to home */}
      {revealed && player.role !== 'mrwhite' && (
        <button
          className={styles.disableBtn}
          onClick={() => setConfirmDisable(true)}
          aria-label="Changer la paire"
        >
          🚫
        </button>
      )}

      {confirmDisable && (
        <ConfirmOverlay
          message="Cette paire sera désactivée et réactivable dans les paramètres. La partie va recommencer."
          icon="🚫"
          confirmLabel="🔄 Changer de paire"
          danger
          onConfirm={() => disableCurrentPairAndRestart(currentPlayerIndex)}
          onCancel={() => setConfirmDisable(false)}
        />
      )}

      {confirmNav === 'setup' && (
        <ConfirmOverlay
          message="Retourner à la configuration ? La partie en cours sera perdue."
          icon="⚙️"
          confirmLabel="↩️ Configuration"
          danger
          onConfirm={() => setPhase('setup')}
          onCancel={() => setConfirmNav(null)}
        />
      )}

      {confirmNav === 'home' && (
        <ConfirmOverlay
          message="Retourner à l'accueil ? La partie en cours sera perdue."
          icon="🏠"
          confirmLabel="🏠 Accueil"
          danger
          onConfirm={() => goHome()}
          onCancel={() => setConfirmNav(null)}
        />
      )}

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
        </>
      )}
    </GameLayout>
  );
}

export default function RevealScreen() {
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const pairId = useGameStore((s) => s.currentPair?.id);

  // Key forces remount → all local state resets when player or pair changes
  return <RevealCard key={`${pairId}-${currentPlayerIndex}`} />;
}
