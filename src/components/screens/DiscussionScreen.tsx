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

type PeekState =
  | { step: 'closed' }
  | { step: 'pick' }
  | { step: 'hidden'; playerIndex: number }
  | { step: 'revealed'; playerIndex: number };

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
  const { players, restartWithSamePlayers, goHome, easyMode, antiCheat } = useGameStore();
  const [showCards, setShowCards] = useState(false);
  const [peek, setPeek] = useState<PeekState>({ step: 'closed' });
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

  const closePeek = () => setPeek({ step: 'closed' });

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

  const handleShowCards = useCallback(() => {
    if (showCards) {
      setShowCards(false);
      return;
    }
    if (antiCheat.showAllAlarm) {
      triggerAlarm(() => {
        setShowCardsCount((prev) => prev + 1);
        setShowCards(true);
      });
    } else {
      setShowCardsCount((prev) => prev + 1);
      setShowCards(true);
    }
  }, [showCards, antiCheat.showAllAlarm, triggerAlarm]);

  const handlePeekReveal = useCallback((playerIndex: number) => {
    if (antiCheat.peekAlarm) {
      triggerAlarm(() => {
        setPeekCounts((prev) => ({ ...prev, [playerIndex]: (prev[playerIndex] || 0) + 1 }));
        setPeek({ step: 'revealed', playerIndex });
      });
    } else {
      setPeekCounts((prev) => ({ ...prev, [playerIndex]: (prev[playerIndex] || 0) + 1 }));
      setPeek({ step: 'revealed', playerIndex });
    }
  }, [antiCheat.peekAlarm, triggerAlarm]);

  return (
    <GameLayout title="Discussion">
      <div className={styles.instruction}>
        Décrivez votre image chacun votre tour, puis votez pour trouver l'espion !
      </div>

      <div className={styles.playerGrid}>
        {players.map((p, i) => (
          <div key={p.id} className={styles.playerCell}>
            <PlayerAvatar
              emoji={p.avatarEmoji}
              color={p.avatarColor}
              name={p.name}
              size="medium"
            />
            {anyPeeked && peekCounts[i] > 0 && (
              <span className={styles.peekBadge}>
                👁️ {peekCounts[i]}
              </span>
            )}
          </div>
        ))}
      </div>

      {anyPeeked && allRevealed && (
        <div className={styles.allRevealedBadge}>
          ✅ Tous les joueurs ont revu leur carte
        </div>
      )}

      <div className={styles.hint}>
        Le vote se fait à l'oral entre joueurs
      </div>

      {/* Peek: re-view my image */}
      {antiCheat.allowPeek && (
        <Button
          variant="secondary"
          block
          icon="🔍"
          onClick={() => setPeek({ step: 'pick' })}
          style={{ maxWidth: 320 }}
        >
          Revoir mon image
        </Button>
      )}

      {/* Reveal cards toggle */}
      {antiCheat.allowShowAll && (
        <Button
          variant={showCards ? 'danger' : 'secondary'}
          block
          icon={alarming ? '🚨' : showCards ? '🙈' : '👀'}
          onClick={handleShowCards}
          disabled={alarming}
          style={{ maxWidth: 320 }}
        >
          {alarming ? 'Attention !' : showCards ? 'Cacher les cartes' : 'Voir les cartes'}
        </Button>
      )}

      {/* Anti-cheat alarm flash overlay (portalled to #root for full-screen coverage) */}
      {alarming && createPortal(<div className={styles.alarmFlash} />, document.getElementById('root')!)}

      {showCards && (
        <>
          {showCardsCount > 1 && (
            <div className={styles.showCardsCounter}>
              👀 Cartes révélées {showCardsCount} fois
            </div>
          )}
          <div className={styles.revealGrid}>
            {players.map((p) => (
              <div key={p.id} className={styles.revealCard} data-role={p.role}>
                <PlayerAvatar
                  emoji={p.avatarEmoji}
                  color={p.avatarColor}
                  size="small"
                />
                <div className={styles.revealInfo}>
                  <span className={styles.revealName}>{p.name}</span>
                  <span className={`${styles.revealRole} ${styles[`role_${p.role}`]}`}>
                    {ROLE_LABELS[p.role]}
                  </span>
                </div>
                <div className={styles.revealEmoji}>
                  {p.emoji ? (
                    <>
                      <EmojiCard emoji={p.emoji} />
                      {p.emojiLabel && <span className={styles.revealLabel}>{p.emojiLabel}</span>}
                    </>
                  ) : (
                    <span className={styles.revealMystery}>❓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.actions}>
        <Button variant="primary" size="large" block icon="🔄" onClick={restartWithSamePlayers}>
          Rejouer
        </Button>
        <Button variant="secondary" block icon="🏠" onClick={goHome}>
          Nouveau jeu
        </Button>
      </div>

      {/* Peek overlay (portalled to #root for full-screen coverage) */}
      {peek.step !== 'closed' && createPortal(
        <div className={styles.peekOverlay} onClick={closePeek}>
          <div className={styles.peekModal} onClick={(e) => e.stopPropagation()}>
            {peek.step === 'pick' && (
              <>
                <div className={styles.peekContent}>
                  <h3 className={styles.peekTitle}>Qui es-tu ?</h3>
                  <div className={styles.peekPlayerList}>
                    {players.map((p, i) => (
                      <button
                        key={p.id}
                        className={styles.peekPlayerBtn}
                        onClick={() => setPeek({ step: 'hidden', playerIndex: i })}
                      >
                        <PlayerAvatar
                          emoji={p.avatarEmoji}
                          color={p.avatarColor}
                          size="medium"
                        />
                        <span className={styles.peekPlayerName}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.peekAction}>
                  <Button variant="secondary" block onClick={closePeek}>
                    Annuler
                  </Button>
                </div>
              </>
            )}

            {peek.step === 'hidden' && (
              <>
                <div className={styles.peekContent}>
                  <PlayerAvatar
                    emoji={players[peek.playerIndex].avatarEmoji}
                    color={players[peek.playerIndex].avatarColor}
                    size="large"
                  />
                  <div className={styles.peekPlayerNameLarge}>
                    {players[peek.playerIndex].name}
                  </div>
                  <div className={styles.peekHint}>
                    Retourne le téléphone vers toi
                  </div>
                  <div className={styles.peekHiddenIcon}>👀</div>
                </div>
                <div className={styles.peekAction}>
                  <Button
                    variant="primary"
                    size="large"
                    block
                    icon={alarming ? '🚨' : '👁️'}
                    disabled={alarming}
                    onClick={() => handlePeekReveal(peek.playerIndex)}
                  >
                    {alarming ? 'Attention !' : 'Voir mon image'}
                  </Button>
                </div>
              </>
            )}

            {peek.step === 'revealed' && (() => {
              const p = players[peek.playerIndex];
              return (
                <>
                  <div className={styles.peekContent}>
                    <PlayerAvatar
                      emoji={p.avatarEmoji}
                      color={p.avatarColor}
                      size="large"
                    />
                    <div className={styles.peekPlayerNameLarge}>{p.name}</div>
                    {p.role === 'mrwhite' ? (
                      <>
                        <div className={styles.peekEmojiDisplay}>
                          <EmojiCard emoji="❓" large mystery />
                        </div>
                        <span className={styles.peekRoleMrwhite}>
                          Tu es Mr. White !
                        </span>
                      </>
                    ) : (
                      <>
                        <div className={styles.peekEmojiDisplay}>
                          <EmojiCard emoji={p.emoji!} large />
                        </div>
                        {p.emojiLabel && (
                          <div className={styles.peekEmojiLabel}>{p.emojiLabel}</div>
                        )}
                        {easyMode && (
                          <span className={`${styles.peekRoleTag} ${
                            p.role === 'civil' ? styles.peekRoleCivil : styles.peekRoleUndercover
                          }`}>
                            {p.role === 'civil' ? 'Tu es Civil ! 🟢' : 'Tu es Undercover ! 🥷'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className={styles.peekAction}>
                    <Button variant="success" size="large" block icon="✅" onClick={closePeek}>
                      J'ai vu !
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.getElementById('root')!,
      )}
    </GameLayout>
  );
}
