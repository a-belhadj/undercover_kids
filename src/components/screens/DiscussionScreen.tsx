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
  const { players, speakingOrder, restartWithSamePlayers, goHome, antiCheat, easyMode, pairDisplayMode } = useGameStore();
  const [showAll, setShowAll] = useState(false);
  const [alarming, setAlarming] = useState(false);
  const alarmRef = useRef<{ stop: () => void } | null>(null);

  // Full-screen peek overlay state (index of the player being peeked, or null)
  const [peekingPlayer, setPeekingPlayer] = useState<number | null>(null);
  // Whether the peek overlay is in confirmation step (true) or showing the card (false)
  const [peekConfirm, setPeekConfirm] = useState(true);
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
    setPeekingPlayer(playerIndex);
    setPeekConfirm(true);
  }, []);

  /** Confirm peek — trigger alarm if needed, then show the card */
  const confirmPeek = useCallback(() => {
    if (peekingPlayer === null) return;
    const reveal = () => {
      setPeekCounts((prev) => ({ ...prev, [peekingPlayer]: (prev[peekingPlayer] || 0) + 1 }));
      setPeekConfirm(false);
    };

    if (antiCheat.peekAlarm) {
      triggerAlarm(reveal);
    } else {
      reveal();
    }
  }, [peekingPlayer, antiCheat.peekAlarm, triggerAlarm]);

  /** Close the peek overlay */
  const closePeek = useCallback(() => {
    setPeekingPlayer(null);
    setPeekConfirm(true);
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
      {peekingPlayer !== null && createPortal(
        <div className={styles.peekOverlay} onClick={peekConfirm ? closePeek : closePeek}>
          <div className={styles.peekContent} onClick={(e) => e.stopPropagation()}>
            <PlayerAvatar
              emoji={players[peekingPlayer].avatarEmoji}
              color={players[peekingPlayer].avatarColor}
              size="large"
            />
            <div className={styles.peekName}>{players[peekingPlayer].name}</div>

            {peekConfirm ? (
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
                {players[peekingPlayer].role === 'mrwhite' ? (
                  <>
                    <div className={styles.peekEmoji}>
                      <EmojiCard emoji="❓" large mystery />
                    </div>
                    <span className={styles.peekRoleTag + ' ' + styles.peekRoleMrwhite}>
                      Tu es Mr. White ! Bluff ! 🎩
                    </span>
                  </>
                ) : (
                  <>
                    {pairDisplayMode !== 'text' && (
                      <div className={`${styles.peekEmoji} emoji-reveal`}>
                        <EmojiCard emoji={players[peekingPlayer].emoji!} large />
                      </div>
                    )}
                    {pairDisplayMode !== 'icon' && players[peekingPlayer].emojiLabel && (
                      <div className={styles.peekEmojiLabel}>{players[peekingPlayer].emojiLabel}</div>
                    )}
                    <span
                      className={`${styles.peekRoleTag} ${
                        easyMode
                          ? players[peekingPlayer].role === 'civil' ? styles.peekRoleCivil : styles.peekRoleUndercover
                          : styles.peekRoleNeutral
                      }`}
                    >
                      {easyMode
                        ? players[peekingPlayer].role === 'civil'
                          ? 'Tu es Civil ! 🟢'
                          : 'Tu es Undercover ! 🥷'
                        : 'Mémorise bien ton image !'}
                    </span>
                  </>
                )}

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
      {showAllConfirm && createPortal(
        <div className={styles.peekOverlay} onClick={cancelShowAll}>
          <div className={styles.peekContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.peekInstruction}>
              Toutes les cartes vont être révélées !
            </div>
            <div className={styles.peekHidden}>👀</div>
            <button className={styles.peekRevealBtn} onClick={confirmShowAll} disabled={alarming}>
              {alarming ? '🚨 Attention !' : '👀 Voir les cartes'}
            </button>
            <button className={styles.showAllCancelBtn} onClick={cancelShowAll}>
              Annuler
            </button>
          </div>
        </div>,
        document.getElementById('root')!,
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
