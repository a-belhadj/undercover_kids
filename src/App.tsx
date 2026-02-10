import { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import HomeScreen from './components/screens/HomeScreen';
import SetupScreen from './components/screens/SetupScreen';
import RevealScreen from './components/screens/RevealScreen';
import DiscussionScreen from './components/screens/DiscussionScreen';

const SCREENS = {
  home: HomeScreen,
  setup: SetupScreen,
  reveal: RevealScreen,
  discussion: DiscussionScreen,
} as const;

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const goHome = useGameStore((s) => s.goHome);
  const Screen = SCREENS[phase];

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

  // Listen for the back button
  useEffect(() => {
    const handlePopState = () => {
      const { phase: currentPhase } = useGameStore.getState();
      if (currentPhase !== 'home') {
        isPopRef.current = true;
        goHome();
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

  return <Screen />;
}
