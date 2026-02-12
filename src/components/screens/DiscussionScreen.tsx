import { useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/gameStore';
import { playAlarm, triggerVibration, flashTorch, ALARM_DURATION } from '../../lib/alarm';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import PlayerAvatar from '../ui/PlayerAvatar';
import PlayerCardReveal from '../ui/PlayerCardReveal';
import ConfirmOverlay from '../ui/ConfirmOverlay';
import EmojiCard from '../ui/EmojiCard';
import styles from './DiscussionScreen.module.css';

const ROLE_LABELS: Record<string, string> = {
  civil: 'Civil',
  undercover: 'Undercover',
  mrwhite: 'Mr. White',
};

type PeekState =
  | { step: 'closed' }
  | { step: 'confirm'; playerIndex: number }
  | { step: 'revealed'; playerIndex: number };

export default function DiscussionScreen() {
  const { players, speakingOrder, restartWithSamePlayers, goHome, antiCheat, easyMode, pairDisplayMode } = useGameStore();
  const [showAll, setShowAll] = useState(false);
  const [alarming, setAlarming] = useState(false);
  const alarmRef = useRef<{ stop: () => void } | null>(null);

  // Full-screen peek overlay state
  const [peekState, setPeekState] = useState<PeekState>({ step: 'closed' });
  // Show all cards confirmation state
  const [showAllConfirm, setShowAllConfirm] = useState(false);

  // Track how many times each player peeked at their card
  const [peekCounts, setPeekCounts] = useState<Record<number, number>>(() => {
    const counts: Record<number, number> = {};
    players.forEach((_, i) => { counts[i] = 0; });
    return counts;
  });

  // Track how many times "Voir les cartes" was used
  const [showCardsCount, setShowCardsCount] = useState(0);

  const anyPeeked = useMemo(
    () => players.some((_, i) => peekCounts[i] > 0) || showCardsCount > 0,
    [players, peekCounts, showCardsCount],
  );

  const allRevealed = useMemo(
    () => players.every((_, i) => peekCounts[i] > 0) || showCardsCount > 0,
    [players, peekCounts, showCardsCount],
  );

  /** Fire alarm sequence (sound + vibration + flash + torch), then call onDone */
  const triggerAlarm = useCallback((onDone: () => void) => {
    setAlarming(true);
    triggerVibration();
    alarmRef.current = playAlarm(ALARM_DURATION);
    flashTorch(ALARM_DURATION);

    setTimeout(() => {
      setAlarming(false);
      alarmRef.current = null;
      onDone();
    }, ALARM_DURATION);
  }, []);

  /** Toggle show all cards */
  const handleShowAll = useCallback(() => {
    if (showAll) {
      setShowAll(false);
      return;
    }
    setShowAllConfirm(true);
  }, [showAll]);

  /** Confirm show all — trigger alarm if needed, then reveal */
  const confirmShowAll = useCallback(() => {
    const reveal = () => {
      setShowCardsCount((prev) => prev + 1);
      setShowAll(true);
      setShowAllConfirm(false);
    };

    if (antiCheat.showAllAlarm) {
      triggerAlarm(reveal);
    } else {
      reveal();
    }
  }, [antiCheat.showAllAlarm, triggerAlarm]);

  const cancelShowAll = useCallback(() => {
    setShowAllConfirm(false);
  }, []);

  /** Peek at a single player's card — opens full-screen overlay in confirmation step */
  const handlePeek = useCallback((playerIndex: number) => {
    setPeekState({ step: 'confirm', playerIndex });
  }, []);

  /** Confirm peek — trigger alarm if needed, then show the card */
  const confirmPeek = useCallback(() => {
    if (peekState.step !== 'confirm') return;
    const { playerIndex } = peekState;
    const reveal = () => {
      setPeekCounts((prev) => ({ ...prev, [playerIndex]: (prev[playerIndex] || 0) + 1 }));
      setPeekState({ step: 'revealed', playerIndex });
    };

    if (antiCheat.peekAlarm) {
      triggerAlarm(reveal);
    } else {
      reveal();
    }
  }, [peekState, antiCheat.peekAlarm, triggerAlarm]);

  /** Close the peek overlay */
  const closePeek = useCallback(() => {
    setPeekState({ step: 'closed' });
  }, []);


  return (
    <GameLayout title="Discussion">
      <div className={styles.instruction}>
        Décrivez votre image chacun votre tour, puis votez pour trouver l'espion !
      </div>

      <div className={styles.speakingOrderTitle}>Ordre de parole</div>
      <div className={styles.speakingOrderList}>
        {speakingOrder.map((playerIdx, order) => {
          const p = players[playerIdx];
          const visible = showAll;
          const hasPeeked = peekCounts[playerIdx] > 0;
          return (
            <div
              key={p.id}
              className={`${styles.speakingOrderItem} ${visible ? styles.speakingOrderItemRevealed : ''}`}
              data-role={visible ? p.role : undefined}
            >
              <span className={styles.speakingOrderNumber}>{order + 1}</span>
              <PlayerAvatar
                emoji={p.avatarEmoji}
                color={p.avatarColor}
                size="small"
              />
              <span className={styles.speakingOrderName}>{p.name}</span>

              {visible ? (
                <div className={styles.inlineCard}>
                  <div className={styles.inlineCardInfo}>
                    <span className={`${styles.inlineRole} ${styles[`role_${p.role}`]}`}>
                      {ROLE_LABELS[p.role]}
                    </span>
                  </div>
                  {p.role === 'mrwhite' ? (
                    <span className={styles.inlineMystery}>❓</span>
                  ) : (
                    <div className={styles.inlineEmoji}>
                      {pairDisplayMode !== 'text' && <EmojiCard emoji={p.emoji!} />}
                      {pairDisplayMode !== 'icon' && p.emojiLabel && <span className={styles.inlineLabel}>{p.emojiLabel}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {anyPeeked && hasPeeked && (
                    <span className={styles.peekBadge}>
                      👁️ {peekCounts[playerIdx]}
                    </span>
                  )}
                  {antiCheat.allowPeek && !alarming && (
                    <button
                      className={styles.eyeBtn}
                      onClick={() => handlePeek(playerIdx)}
                      aria-label={`Voir la carte de ${p.name}`}
                    >
                      👁️
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Full-screen peek overlay */}
      {peekState.step !== 'closed' && createPortal(
        <div className={styles.peekOverlay} onClick={closePeek}>
          <div className={styles.peekContent} onClick={(e) => e.stopPropagation()}>
            <PlayerAvatar
              emoji={players[peekState.playerIndex].avatarEmoji}
              color={players[peekState.playerIndex].avatarColor}
              size="large"
            />
            <div className={styles.peekName}>{players[peekState.playerIndex].name}</div>

            {peekState.step === 'confirm' ? (
              <>
                <div className={styles.peekInstruction}>
                  Retourne le téléphone vers toi
                </div>
                <div className={styles.peekHidden}>👀</div>
                <button className={styles.peekRevealBtn} onClick={confirmPeek} disabled={alarming}>
                  {alarming ? '🚨 Attention !' : '👁️ Voir mon image'}
                </button>
              </>
            ) : (
              <div className={styles.peekCardArea} onClick={closePeek}>
                <PlayerCardReveal
                  role={players[peekState.playerIndex].role}
                  emoji={players[peekState.playerIndex].emoji}
                  emojiLabel={players[peekState.playerIndex].emojiLabel}
                  easyMode={easyMode}
                  pairDisplayMode={pairDisplayMode}
                />

                <button className={styles.peekCloseBtn} onClick={closePeek}>
                  ✅ J'ai vu !
                </button>
              </div>
            )}
          </div>
        </div>,
        document.getElementById('root')!,
      )}

      {anyPeeked && allRevealed && (
        <div className={styles.allRevealedBadge}>
          Tous les joueurs ont revu leur carte
        </div>
      )}

      <div className={styles.hint}>
        Le vote se fait à l'oral entre joueurs
      </div>

      {/* Reveal all cards toggle */}
      {antiCheat.allowShowAll && (
        <Button
          variant={showAll ? 'danger' : 'secondary'}
          block
          icon={alarming ? '🚨' : showAll ? '🙈' : '👀'}
          onClick={handleShowAll}
          disabled={alarming}
          style={{ maxWidth: 320 }}
        >
          {alarming ? 'Attention !' : showAll ? 'Cacher les cartes' : 'Voir les cartes'}
        </Button>
      )}

      {showAll && showCardsCount > 1 && (
        <div className={styles.showCardsCounter}>
          Cartes révélées {showCardsCount} fois
        </div>
      )}

      {/* Show all confirmation overlay */}
      {showAllConfirm && (
        <ConfirmOverlay
          message="Toutes les cartes vont être révélées !"
          confirmLabel={alarming ? '🚨 Attention !' : '👀 Voir les cartes'}
          disabled={alarming}
          onConfirm={confirmShowAll}
          onCancel={cancelShowAll}
        />
      )}

      {/* Anti-cheat alarm flash overlay (portalled to #root for full-screen coverage) */}
      {alarming && createPortal(<div className={styles.alarmFlash} />, document.getElementById('root')!)}

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
