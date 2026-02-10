import { useState, useEffect } from 'react';
import { CATEGORIES, emojiPairs } from '../../data/emojiPairs';
import { loadDisabledPairs, saveDisabledPairs } from '../../lib/storage';
import { encodePairConfig, decodePairConfig } from '../../lib/pairConfig';
import { isImageUrl } from '../../lib/isImageUrl';
import styles from './PairBrowser.module.css';

function EmojiOrImage({ value, className }: { value: string; className?: string }) {
  if (isImageUrl(value)) {
    return <img src={value} alt="" className={className} draggable={false} />;
  }
  return <span className={className}>{value}</span>;
}

interface PairBrowserProps {
  onClose?: () => void;
  embedded?: boolean;
}

export default function PairBrowser({ onClose, embedded }: PairBrowserProps) {
  const [disabledIds, setDisabledIds] = useState<Set<string>>(() => new Set(loadDisabledPairs()));
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    saveDisabledPairs([...disabledIds]);
  }, [disabledIds]);

  const togglePair = (id: string) => {
    setDisabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategory = (categoryId: string) => {
    const catPairs = emojiPairs.filter((p) => p.category === categoryId);
    const allDisabled = catPairs.every((p) => disabledIds.has(p.id));
    setDisabledIds((prev) => {
      const next = new Set(prev);
      for (const pair of catPairs) {
        if (allDisabled) {
          next.delete(pair.id);
        } else {
          next.add(pair.id);
        }
      }
      return next;
    });
  };

  const enableAll = () => setDisabledIds(new Set());
  const totalEnabled = emojiPairs.length - disabledIds.size;

  const handleShare = () => {
    const code = encodePairConfig(disabledIds);
    setShareCode(code);
    setCopied(false);
    setImportError(null);
    setImportSuccess(false);
  };

  const handleCopy = async () => {
    if (!shareCode) return;
    try {
      // Try modern API first
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareCode);
        setCopied(true);
        return;
      }
    } catch {
      // Fall through to fallback
    }
    // Fallback: temporary textarea + execCommand
    try {
      const ta = document.createElement('textarea');
      ta.value = shareCode;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    } catch {
      // Last resort: nothing we can do
    }
  };

  const handleImport = () => {
    const trimmed = importCode.trim();
    if (!trimmed) {
      setImportError('Colle un code ici');
      return;
    }
    const result = decodePairConfig(trimmed);
    if (result === null) {
      setImportError('Code invalide');
      setImportSuccess(false);
      return;
    }
    setDisabledIds(result);
    setImportError(null);
    setImportSuccess(true);
    setShareCode(null);
    setImportCode('');
  };

  const content = (
    <>
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={enableAll}>Tout activer</button>
        <button className={styles.toolBtn} onClick={handleShare}>Partager</button>
        <span className={styles.counter}>{totalEnabled}/{emojiPairs.length}</span>
      </div>

      {/* Share / Import section */}
      {shareCode && (
        <div className={styles.shareSection}>
          <div className={styles.shareLabel}>Code de ta config :</div>
          <div className={styles.shareCodeRow}>
            <code className={styles.shareCode}>{shareCode}</code>
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copied ? '✓' : 'Copier'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.importSection}>
        <div className={styles.importRow}>
          <input
            className={styles.importInput}
            type="text"
            placeholder="Coller un code ici"
            value={importCode}
            onChange={(e) => { setImportCode(e.target.value); setImportError(null); setImportSuccess(false); }}
          />
          <button className={styles.importBtn} onClick={handleImport}>Importer</button>
        </div>
        {importError && <div className={styles.importError}>{importError}</div>}
        {importSuccess && <div className={styles.importOk}>Config importée !</div>}
      </div>

      <div className={styles.list}>
        {CATEGORIES.map((cat) => {
          const catPairs = emojiPairs.filter((p) => p.category === cat.id);
          const enabledCount = catPairs.filter((p) => !disabledIds.has(p.id)).length;
          const allDisabled = enabledCount === 0;
          const isExpanded = expandedCategory === cat.id;

          return (
            <div key={cat.id} className={styles.category}>
              <button
                className={styles.categoryHeader}
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
              >
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catLabel}>{cat.label}</span>
                <span className={styles.catCount}>{enabledCount}/{catPairs.length}</span>
                <span className={styles.chevron}>{isExpanded ? '▾' : '▸'}</span>
              </button>

              {isExpanded && (
                <div className={styles.pairList}>
                  <button
                    className={allDisabled ? styles.toggleAllBtn : styles.toggleAllBtnActive}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {allDisabled ? 'Tout activer' : 'Tout désactiver'}
                  </button>

                  {catPairs.map((pair) => {
                    const enabled = !disabledIds.has(pair.id);
                    return (
                      <button
                        key={pair.id}
                        className={enabled ? styles.pairRow : styles.pairRowDisabled}
                        onClick={() => togglePair(pair.id)}
                      >
                        <div className={styles.pairEmojis}>
                          <EmojiOrImage value={pair.civil} className={styles.pairEmoji} />
                          <span className={styles.vs}>vs</span>
                          <EmojiOrImage value={pair.undercover} className={styles.pairEmoji} />
                        </div>
                        <div className={styles.pairLabels}>
                          <span>{pair.civilLabel}</span>
                          <span className={styles.vsText}>vs</span>
                          <span>{pair.undercoverLabel}</span>
                        </div>
                        <span className={styles.checkmark}>{enabled ? '✓' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Gérer les paires</span>
          <span className={styles.counter}>{totalEnabled}/{emojiPairs.length}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {content}
      </div>
    </div>
  );
}
