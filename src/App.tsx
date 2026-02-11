import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from './store/gameStore';
import Button from './components/ui/Button';
import HomeScreen from './components/screens/HomeScreen';
import SetupScreen from './components/screens/SetupScreen';
import RevealScreen from './components/screens/RevealScreen';
import DiscussionScreen from './components/screens/DiscussionScreen';
import styles from './App.module.css';

const SCREENS = {
  home: HomeScreen,
  setup: SetupScreen,
  reveal: RevealScreen,
  discussion: DiscussionScreen,
} as const;

/** Phases where quitting loses the game and needs confirmation */
const PROTECTED_PHASES = new Set(['reveal', 'discussion']);

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const goHome = useGameStore((s) => s.goHome);
  const Screen = SCREENS[phase];

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Derive: confirm dialog only meaningful during protected phases
  const effectiveShowLeaveConfirm = showLeaveConfirm && PROTECTED_PHASES.has(phase);

  // Track whether the phase change was caused by a popstate (back button)
  const isPopRef = useRef(false);

  // Push a history entry every time we leave the home screen
  useEffect(() => {
    if (isPopRef.current) {
      // This phase change was caused by the back button — don't push again
      isPopRef.current = false;
      return;
    }
    if (phase !== 'home') {
      window.history.pushState({ phase }, '');
    }
  }, [phase]);

  const handleConfirmLeave = useCallback(() => {
    setShowLeaveConfirm(false);
    isPopRef.current = true;
    goHome();
  }, [goHome]);

  const handleCancelLeave = useCallback(() => {
    setShowLeaveConfirm(false);
  }, []);

  // Listen for the back button
  useEffect(() => {
    const handlePopState = () => {
      const { phase: currentPhase } = useGameStore.getState();
      if (currentPhase !== 'home') {
        // Re-push the current phase so back doesn't actually navigate away
        window.history.pushState({ phase: currentPhase }, '');

        if (PROTECTED_PHASES.has(currentPhase)) {
          // Show confirmation instead of leaving immediately
          setShowLeaveConfirm(true);
        } else {
          isPopRef.current = true;
          goHome();
        }
      } else {
        // Already home — push a state so next back press doesn't exit either
        window.history.pushState({ phase: 'home' }, '');
      }
    };

    // Seed initial history entry so the first back press doesn't exit
    window.history.replaceState({ phase: 'home' }, '');

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [goHome]);

  return (
    <>
      <Screen />
      {effectiveShowLeaveConfirm && createPortal(
        <div className={styles.overlay} onClick={handleCancelLeave}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalEmoji}>⚠️</div>
            <div className={styles.modalTitle}>Quitter la partie ?</div>
            <div className={styles.modalText}>
              La partie en cours sera perdue.
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={handleCancelLeave}>
                Continuer
              </Button>
              <Button variant="danger" onClick={handleConfirmLeave}>
                Quitter
              </Button>
            </div>
          </div>
        </div>,
        document.getElementById('root')!,
      )}
    </>
  );
}
