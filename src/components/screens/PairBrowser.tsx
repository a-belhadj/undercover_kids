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
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    saveDisabledPairs([...disabledIds]);
  }, [disabledIds]);

  const enablePair = (id: string) => {
    setDisabledIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const enableCategory = (categoryId: string) => {
    setDisabledIds((prev) => {
      const next = new Set(prev);
      for (const pair of emojiPairs.filter((p) => p.category === categoryId)) {
        next.delete(pair.id);
      }
      return next;
    });
  };

  const enableAll = () => setDisabledIds(new Set());

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
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareCode);
        setCopied(true);
        return;
      }
    } catch {
      // Fall through to fallback
    }
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

  // Only show disabled pairs, grouped by category
  const disabledPairs = emojiPairs.filter((p) => disabledIds.has(p.id));
  const disabledByCategory = CATEGORIES
    .map((cat) => ({
      ...cat,
      pairs: disabledPairs.filter((p) => p.category === cat.id),
    }))
    .filter((cat) => cat.pairs.length > 0);

  const content = (
    <>
      {/* Share / Import section */}
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={handleShare}>Partager</button>
        <span className={styles.counter}>{emojiPairs.length - disabledIds.size}/{emojiPairs.length} actives</span>
      </div>

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

      {/* Disabled pairs list */}
      {disabledPairs.length === 0 ? (
        <div className={styles.emptyState}>
          Toutes les paires sont actives !
        </div>
      ) : (
        <>
          <div className={styles.disabledHeader}>
            <span>{disabledPairs.length} paire{disabledPairs.length > 1 ? 's' : ''} désactivée{disabledPairs.length > 1 ? 's' : ''}</span>
            <button className={styles.toolBtn} onClick={enableAll}>Tout réactiver</button>
          </div>

          <div className={styles.list}>
            {disabledByCategory.map((cat) => (
              <div key={cat.id} className={styles.category}>
                <div className={styles.categoryHeader}>
                  <span className={styles.catIcon}>{cat.icon}</span>
                  <span className={styles.catLabel}>{cat.label}</span>
                  <span className={styles.catCount}>{cat.pairs.length}</span>
                  <button
                    className={styles.enableCatBtn}
                    onClick={() => enableCategory(cat.id)}
                  >
                    Tout réactiver
                  </button>
                </div>

                <div className={styles.pairList}>
                  {cat.pairs.map((pair) => (
                    <div key={pair.id} className={styles.pairRow}>
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
                      <button className={styles.enableBtn} onClick={() => enablePair(pair.id)}>
                        Réactiver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Paires désactivées</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {content}
      </div>
    </div>
  );
}
