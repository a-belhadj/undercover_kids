import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import Settings from './Settings';
import PacksScreen from './PacksScreen';
import styles from './HomeScreen.module.css';

const RULES_SLIDES = [
  { emoji: '🎯', text: 'Chaque joueur reçoit une image en secret.' },
  { emoji: '🕵️', text: "L'espion a une image différente mais qui ressemble !" },
  { emoji: '🗣️', text: 'Décrivez votre image chacun votre tour avec un mot.' },
  { emoji: '🗳️', text: "Votez pour éliminer celui que vous pensez être l'espion !" },
  { emoji: '🏆', text: "Les civils gagnent si l'espion est démasqué !" },
];

export default function HomeScreen() {
  const setPhase = useGameStore((s) => s.setPhase);
  const [showRules, setShowRules] = useState(false);
  const [ruleIndex, setRuleIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showPacks, setShowPacks] = useState(false);

  useScrollToTop();

  return (
    <GameLayout fit>
      <div className={styles.container}>
        <div className={`${styles.logo} pulse`}>🕵️</div>
        <div className={styles.title}>Undercover Kids</div>
        <div className={styles.subtitle}>Trouve l'espion !</div>

        <div className={styles.buttons}>
          <Button variant="primary" size="large" block icon="▶️" onClick={() => setPhase('setup')}>
            Jouer
          </Button>
          <Button variant="secondary" block icon="⚙️" onClick={() => setShowSettings(true)}>
            Paramètres
          </Button>
          <Button variant="secondary" block icon="✏️" onClick={() => setShowPacks(true)}>
            Mes paires
          </Button>
          <Button variant="secondary" block icon="❓" onClick={() => { setRuleIndex(0); setShowRules(true); }}>
            Règles
          </Button>
        </div>
      </div>

      <div className={styles.credits}>
        Icônes :{' '}
        <a href="https://icons8.com" target="_blank" rel="noopener noreferrer">Icons8</a>
        {' · '}
        <a href="https://www.veryicon.com" target="_blank" rel="noopener noreferrer">VeryIcon</a>
        {' · '}
        <a href="https://www.disneyclips.com" target="_blank" rel="noopener noreferrer">Disneyclips</a>
      </div>

      {showRules && (
        <div className={styles.overlay} onClick={() => setShowRules(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              Règle {ruleIndex + 1}/{RULES_SLIDES.length}
            </div>
            <div className={styles.modalEmoji}>
              {RULES_SLIDES[ruleIndex].emoji}
            </div>
            <div className={styles.modalText}>
              {RULES_SLIDES[ruleIndex].text}
            </div>
            <div className={styles.modalActions}>
              {ruleIndex > 0 && (
                <Button variant="secondary" onClick={() => setRuleIndex((i) => i - 1)}>
                  ←
                </Button>
              )}
              {ruleIndex < RULES_SLIDES.length - 1 ? (
                <Button variant="primary" onClick={() => setRuleIndex((i) => i + 1)}>
                  Suivant →
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setShowRules(false)}>
                  Compris !
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings overlay */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}

      {/* Packs overlay */}
      {showPacks && (
        <PacksScreen onClose={() => setShowPacks(false)} />
      )}
    </GameLayout>
  );
}
