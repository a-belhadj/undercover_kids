import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import Settings from './Settings';
import PacksScreen from './PacksScreen';
import styles from './HomeScreen.module.css';

const RULES_SLIDES = [
  { emoji: '🎯', title: 'Le but', text: 'Les civils cherchent à démasquer les intrus. Les intrus cherchent à passer inaperçus !' },
  { emoji: '👤', title: 'Les civils', text: 'La majorité des joueurs. Ils reçoivent tous la même image et doivent trouver les intrus.' },
  { emoji: '🥷', title: 'Undercover', text: "Reçoit une image proche mais différente de celle des civils. Il doit bluffer pour ne pas se faire repérer !" },
  { emoji: '🎩', title: 'Mr. White', text: "Ne reçoit aucune image ! Il doit écouter les autres et inventer une description crédible." },
  { emoji: '🗣️', title: 'Le tour de parole', text: 'Chaque joueur décrit son image en un seul mot, sans trop en dire.' },
  { emoji: '🗳️', title: 'Le vote', text: 'Après les descriptions, tout le monde vote pour éliminer le joueur le plus suspect.' },
  { emoji: '🏆', title: 'La victoire', text: "Civils : éliminez tous les intrus ! Intrus : survivez jusqu'à égalité avec les civils." },
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
              {RULES_SLIDES[ruleIndex].emoji} {RULES_SLIDES[ruleIndex].title}
            </div>
            <div className={styles.modalText}>
              {RULES_SLIDES[ruleIndex].text}
            </div>
            <div className={styles.modalStep}>
              {ruleIndex + 1} / {RULES_SLIDES.length}
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
