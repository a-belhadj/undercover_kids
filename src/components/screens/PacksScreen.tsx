import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateId } from '../../lib/generateId';
import { isImageUrl } from '../../lib/isImageUrl';
import type { EmojiPair } from '../../types/game';
import styles from './PacksScreen.module.css';

interface PacksScreenProps {
  onClose: () => void;
}

interface PairForm {
  civilLabel: string;
  civil: string;
  undercoverLabel: string;
  undercover: string;
}

const EMPTY_FORM: PairForm = { civilLabel: '', civil: '', undercoverLabel: '', undercover: '' };

function PairSide({ value, label }: { value: string; label: string }) {
  const hasIcon = value && value !== label;
  return (
    <div className={styles.pairSide}>
      {hasIcon && (
        isImageUrl(value)
          ? <img src={value} alt={label} className={styles.pairSideImg} />
          : <span className={styles.pairSideEmoji}>{value}</span>
      )}
      <span className={styles.pairSideLabel}>{label}</span>
    </div>
  );
}

export default function PacksScreen({ onClose }: PacksScreenProps) {
  const { customPairs, addCustomPair, removeCustomPair, updateCustomPair, toggleDisabledPair, disabledPairIds } = useGameStore();

  const [form, setForm] = useState<PairForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function setField(field: keyof PairForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  function startEdit(pair: EmojiPair) {
    setForm({
      civilLabel: pair.civilLabel,
      civil: pair.civil,
      undercoverLabel: pair.undercoverLabel,
      undercover: pair.undercover,
    });
    setEditingId(pair.id);
    setError('');
  }

  function cancelEdit() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  }

  function handleSave() {
    const { civilLabel, civil, undercoverLabel, undercover } = form;
    if (!civilLabel.trim()) { setError('Le mot 1 est requis'); return; }
    if (!undercoverLabel.trim()) { setError('Le mot 2 est requis'); return; }

    const pair: EmojiPair = {
      id: editingId ?? generateId(),
      category: 'custom',
      civilLabel: civilLabel.trim(),
      civil: civil.trim() || civilLabel.trim(),
      undercoverLabel: undercoverLabel.trim(),
      undercover: undercover.trim() || undercoverLabel.trim(),
    };

    if (editingId !== null) {
      updateCustomPair(pair);
    } else {
      addCustomPair(pair);
    }
    cancelEdit();
  }

  const canSave = form.civilLabel.trim().length > 0 && form.undercoverLabel.trim().length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>✏️ Mes paires</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* Form */}
          <div className={styles.addSection}>
            <div className={styles.addSectionTitle}>
              {editingId ? 'Modifier la paire' : '+ Nouvelle paire'}
            </div>
            <div className={styles.addSectionBody}>
              {error && <div className={styles.errorMsg}>{error}</div>}

              <div className={styles.pairFormRows}>
                <div className={styles.pairFormRow}>
                  <input
                    className={styles.input}
                    style={{ width: '3.5rem', flex: 'none', textAlign: 'center', fontSize: '1.2rem' }}
                    placeholder="🍕"
                    value={form.civil}
                    onChange={(e) => setField('civil', e.target.value)}
                    maxLength={200}
                  />
                  <input
                    className={styles.input}
                    placeholder="Mot 1 *"
                    value={form.civilLabel}
                    onChange={(e) => setField('civilLabel', e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className={styles.pairFormRow}>
                  <input
                    className={styles.input}
                    style={{ width: '3.5rem', flex: 'none', textAlign: 'center', fontSize: '1.2rem' }}
                    placeholder="🍔"
                    value={form.undercover}
                    onChange={(e) => setField('undercover', e.target.value)}
                    maxLength={200}
                  />
                  <input
                    className={styles.input}
                    placeholder="Mot 2 *"
                    value={form.undercoverLabel}
                    onChange={(e) => setField('undercoverLabel', e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                * requis · l'icône/URL est optionnelle
              </div>

              <div className={styles.inputRow} style={{ gap: '0.5rem' }}>
                <button
                  className={styles.submitBtn}
                  onClick={handleSave}
                  disabled={!canSave}
                >
                  {editingId ? 'Enregistrer' : '+ Ajouter'}
                </button>
                {editingId && (
                  <button className={styles.actionBtn} onClick={cancelEdit}>
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pair list */}
          {customPairs.length === 0 ? (
            <div className={styles.emptyState}>
              Aucune paire custom.<br />
              Ajoute une paire ci-dessus !
            </div>
          ) : (
            <>
              <div className={styles.sectionTitle}>{customPairs.length} paire{customPairs.length > 1 ? 's' : ''} custom</div>
              {customPairs.map((pair) => (
                <div key={pair.id} className={`${styles.packCard}${disabledPairIds.includes(pair.id) ? ` ${styles.packCardDisabled}` : ''}`}>
                  <div className={styles.pairCardRow}>
                    <PairSide value={pair.civil} label={pair.civilLabel} />
                    <span className={styles.pairSep}>↔</span>
                    <PairSide value={pair.undercover} label={pair.undercoverLabel} />
                    {disabledPairIds.includes(pair.id) && (
                      <span className={styles.disabledBadge}>désactivé</span>
                    )}
                  </div>
                  <div className={styles.packActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => toggleDisabledPair(pair.id)}
                    >
                      {disabledPairIds.includes(pair.id) ? '▶ Activer' : '⏸ Désactiver'}
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => startEdit(pair)}
                    >
                      ✎ Modifier
                    </button>
                    <button
                      className={styles.actionBtnDanger}
                      onClick={() => removeCustomPair(pair.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
