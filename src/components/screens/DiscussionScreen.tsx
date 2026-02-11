import { useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/gameStore';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import PlayerAvatar from '../ui/PlayerAvatar';
import EmojiCard from '../ui/EmojiCard';
import styles from './DiscussionScreen.module.css';

const ROLE_LABELS: Record<string, string> = {
  civil: 'Civil',
  undercover: 'Undercover',
  mrwhite: 'Mr. White',
};

/** Play an alarm sound using Web Audio API (no file needed) */
function playAlarm(duration = 1500): { stop: () => void } {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = 800;
    osc1.connect(gain);
    osc1.start();

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 600;
    osc2.connect(gain);
    osc2.start();

    // Alternate between two tones for siren effect
    const interval = setInterval(() => {
      const t = ctx.currentTime;
      osc1.frequency.setValueAtTime(osc1.frequency.value === 800 ? 600 : 800, t);
      osc2.frequency.setValueAtTime(osc2.frequency.value === 600 ? 800 : 600, t);
    }, 200);

    const stop = () => {
      clearInterval(interval);
      osc1.stop();
      osc2.stop();
      ctx.close();
    };

    setTimeout(stop, duration);
    return { stop };
  } catch {
    return { stop: () => {} };
  }
}

/** Trigger vibration pattern */
function triggerVibration() {
  try {
    // Pattern: vibrate 200ms, pause 100ms, repeated
    navigator.vibrate([200, 100, 200, 100, 200, 100, 200, 100, 200]);
  } catch {
    // Vibration API not available
  }
}

/** Flash the phone's torch LED (Android Chrome only, fails silently elsewhere) */
async function flashTorch(duration = 1500): Promise<() => void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    const track = stream.getVideoTracks()[0];
    // Check torch support
    const capabilities = track.getCapabilities?.();
    if (!capabilities || !(capabilities as Record<string, unknown>)['torch']) {
      track.stop();
      return () => {};
    }

    // Blink pattern: 200ms on, 150ms off
    let stopped = false;
    const blink = async () => {
      while (!stopped) {
        await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
        await new Promise((r) => setTimeout(r, 200));
        if (stopped) break;
        await track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] });
        await new Promise((r) => setTimeout(r, 150));
      }
    };
    blink();

    const stop = () => {
      stopped = true;
      track.stop();
    };

    setTimeout(stop, duration);
    return stop;
  } catch {
    // Permission denied or API not available — silent fail
    return () => {};
  }
}

const ALARM_DURATION = 1500;

export default function DiscussionScreen() {
  const { players, speakingOrder, restartWithSamePlayers, goHome, antiCheat } = useGameStore();
  const [showAll, setShowAll] = useState(false);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<number>>(new Set());
  const [alarming, setAlarming] = useState(false);
  const alarmRef = useRef<{ stop: () => void } | null>(null);

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

  /** Toggle show all cards inline */
  const handleShowAll = useCallback(() => {
    if (showAll) {
      setShowAll(false);
      return;
    }
    if (antiCheat.showAllAlarm) {
      triggerAlarm(() => {
        setShowCardsCount((prev) => prev + 1);
        setShowAll(true);
      });
    } else {
      setShowCardsCount((prev) => prev + 1);
      setShowAll(true);
    }
  }, [showAll, antiCheat.showAllAlarm, triggerAlarm]);

  /** Peek at a single player's card inline */
  const handlePeek = useCallback((playerIndex: number) => {
    const reveal = () => {
      setPeekCounts((prev) => ({ ...prev, [playerIndex]: (prev[playerIndex] || 0) + 1 }));
      setRevealedPlayers((prev) => {
        const next = new Set(prev);
        next.add(playerIndex);
        return next;
      });
    };

    if (antiCheat.peekAlarm) {
      triggerAlarm(reveal);
    } else {
      reveal();
    }
  }, [antiCheat.peekAlarm, triggerAlarm]);

  /** Hide a single player's card */
  const handleHide = useCallback((playerIndex: number) => {
    setRevealedPlayers((prev) => {
      const next = new Set(prev);
      next.delete(playerIndex);
      return next;
    });
  }, []);

  /** Check if a player's card should be visible */
  const isVisible = (playerIdx: number) => showAll || revealedPlayers.has(playerIdx);

  return (
    <GameLayout title="Discussion">
      <div className={styles.instruction}>
        Décrivez votre image chacun votre tour, puis votez pour trouver l'espion !
      </div>

      <div className={styles.speakingOrderTitle}>Ordre de parole</div>
      <div className={styles.speakingOrderList}>
        {speakingOrder.map((playerIdx, order) => {
          const p = players[playerIdx];
          const visible = isVisible(playerIdx);
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
                      <EmojiCard emoji={p.emoji!} />
                      {p.emojiLabel && <span className={styles.inlineLabel}>{p.emojiLabel}</span>}
                    </div>
                  )}
                  {/* Hide button for individual peek (not when showAll) */}
                  {!showAll && (
                    <button
                      className={styles.eyeBtn}
                      onClick={() => handleHide(playerIdx)}
                      aria-label={`Cacher la carte de ${p.name}`}
                    >
                      🙈
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {anyPeeked && peekCounts[playerIdx] > 0 && (
                    <span className={styles.peekBadge}>
                      👁️ {peekCounts[playerIdx]}
                    </span>
                  )}
                  {/* Eye button to peek at this player */}
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
