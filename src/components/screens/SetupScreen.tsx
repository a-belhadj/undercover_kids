import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { clampIntrusCounts } from '../../logic/roles';
import { CATEGORIES, emojiPairs } from '../../data/emojiPairs';
import { AVATAR_EMOJIS, AVATAR_COLORS } from '../../types/game';
import { loadPlayerProfiles, savePlayerProfiles, loadDisabledPairs, loadRoster, saveRoster, loadGroups, saveGroups } from '../../lib/storage';
import { generateId } from '../../lib/generateId';
import { resolveGroupMembers } from '../../lib/resolveGroupMembers';
import { useDragListeners } from '../../hooks/useDragListeners';
import type { RosterPlayer, PlayerGroup } from '../../types/game';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import PlayerAvatar, { AvatarEmoji } from '../ui/PlayerAvatar';
import styles from './SetupScreen.module.css';

const MAX_PLAYERS = 16;

export default function SetupScreen() {
  const { setPhase, startGame, undercoverCount, setUndercoverCount, mrWhiteCount, setMrWhiteCount, intrusCount, setIntrusCount, undercoverEnabled, setUndercoverEnabled, mrWhiteEnabled, setMrWhiteEnabled, randomSplit, setRandomSplit, selectedCategories, toggleCategory, setSelectedCategory, customPairs } =
    useGameStore();

  // Load saved profiles on mount
  const [savedProfiles] = useState(() => loadPlayerProfiles());
  const hasSaved = savedProfiles.length > 0;

  // Count enabled & total pairs per category
  const { enabledPerCategory, totalPerCategory } = useMemo(() => {
    const disabled = new Set(loadDisabledPairs());
    const enabled: Record<string, number> = {};
    const total: Record<string, number> = {};
    for (const cat of CATEGORIES) { enabled[cat.id] = 0; total[cat.id] = 0; }
    for (const pair of emojiPairs) {
      total[pair.category]++;
      if (!disabled.has(pair.id)) enabled[pair.category]++;
    }
    return { enabledPerCategory: enabled, totalPerCategory: total };
  }, []);

  const customPairsCount = customPairs.length;

  const [playerCount, setPlayerCount] = useState(() =>
    hasSaved ? Math.max(3, Math.min(MAX_PLAYERS, savedProfiles.length)) : 4,
  );
  const [names, setNames] = useState<string[]>(() => {
    const arr = Array(MAX_PLAYERS).fill('') as string[];
    savedProfiles.forEach((p, i) => { if (i < MAX_PLAYERS) arr[i] = p.name; });
    return arr;
  });
  const [playerAvatars, setPlayerAvatars] = useState<string[]>(() => {
    const defaults = AVATAR_EMOJIS.slice(0, MAX_PLAYERS).map(String);
    savedProfiles.forEach((p, i) => { if (i < MAX_PLAYERS) defaults[i] = p.avatarEmoji; });
    return defaults;
  });
  const [playerColors, setPlayerColors] = useState<string[]>(() => {
    const defaults = AVATAR_COLORS.slice(0, MAX_PLAYERS).map(String);
    savedProfiles.forEach((p, i) => { if (i < MAX_PLAYERS) defaults[i] = p.avatarColor; });
    return defaults;
  });
  const [editingAvatar, setEditingAvatar] = useState<number | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  // UC and MW are always both active now — force on mount if stored as off
  useEffect(() => {
    if (!undercoverEnabled) setUndercoverEnabled(true);
    if (!mrWhiteEnabled) setMrWhiteEnabled(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clamp intrusCount and sub-counts when config changes
  useEffect(() => {
    const clamped = clampIntrusCounts(playerCount, {
      intrusCount, undercoverCount, mrWhiteCount, undercoverEnabled, mrWhiteEnabled, randomSplit,
    });
    if (clamped.intrusCount !== intrusCount) setIntrusCount(clamped.intrusCount);
    if (clamped.undercoverCount !== undercoverCount) setUndercoverCount(clamped.undercoverCount);
    if (clamped.mrWhiteCount !== mrWhiteCount) setMrWhiteCount(clamped.mrWhiteCount);
  }, [playerCount, intrusCount, undercoverCount, mrWhiteCount, undercoverEnabled, mrWhiteEnabled, randomSplit, setIntrusCount, setUndercoverCount, setMrWhiteCount]);

  // Load roster & groups for "Charger un groupe" feature
  const roster = useMemo(() => loadRoster(), []);
  const groups = useMemo(() => {
    const allGroups = loadGroups();
    // Only show groups with 3-16 valid roster players
    return allGroups.filter((g) => {
      const validCount = g.playerIds.filter((pid) => roster.some((r) => r.id === pid)).length;
      return validCount >= 3 && validCount <= MAX_PLAYERS;
    });
  }, [roster]);

  const handleLoadGroup = (group: PlayerGroup) => {
    const members = resolveGroupMembers(group.playerIds, roster);
    const count = Math.max(3, Math.min(MAX_PLAYERS, members.length));
    setPlayerCount(count);
    setNames((prev) => {
      const next = [...prev];
      for (let i = 0; i < MAX_PLAYERS; i++) {
        next[i] = i < members.length ? members[i].name : '';
      }
      return next;
    });
    setPlayerAvatars((prev) => {
      const next = [...prev];
      for (let i = 0; i < MAX_PLAYERS; i++) {
        if (i < members.length) next[i] = members[i].avatarEmoji;
      }
      return next;
    });
    setPlayerColors((prev) => {
      const next = [...prev];
      for (let i = 0; i < MAX_PLAYERS; i++) {
        if (i < members.length) next[i] = members[i].avatarColor;
      }
      return next;
    });
    setShowGroupPicker(false);
  };

  const handleCreateGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return;
    // Get current players with filled names
    const currentPlayers = names.slice(0, playerCount)
      .map((name, i) => ({ name: name.trim(), avatarEmoji: playerAvatars[i], avatarColor: playerColors[i] }))
      .filter((p) => p.name.length > 0);
    if (currentPlayers.length < 3) return;

    // Add players to roster (avoid duplicates by name)
    const currentRoster = loadRoster();
    const newRosterPlayers: RosterPlayer[] = [];
    const playerIds: string[] = [];

    for (const p of currentPlayers) {
      const existing = currentRoster.find((r) => r.name === p.name);
      if (existing) {
        // Update avatar if changed
        existing.avatarEmoji = p.avatarEmoji;
        existing.avatarColor = p.avatarColor;
        playerIds.push(existing.id);
      } else {
        const newPlayer: RosterPlayer = {
          id: generateId(),
          name: p.name,
          avatarEmoji: p.avatarEmoji,
          avatarColor: p.avatarColor,
        };
        newRosterPlayers.push(newPlayer);
        playerIds.push(newPlayer.id);
      }
    }

    const updatedRoster = [...currentRoster, ...newRosterPlayers];
    saveRoster(updatedRoster);

    // Create the group
    const currentGroups = loadGroups();
    const newGroup: PlayerGroup = {
      id: generateId(),
      name: trimmedName,
      playerIds,
    };
    saveGroups([...currentGroups, newGroup]);

    setNewGroupName('');
    setShowCreateGroup(false);
  };

  // Min players with names filled (for create group validation)
  const filledPlayerCount = names.slice(0, playerCount).filter((n) => n.trim().length > 0).length;

  const activeAvatars = playerAvatars.slice(0, playerCount);
  const canStart = names.slice(0, playerCount).every((n) => n.trim().length > 0);

  // Max intrus: derived from clamp logic (single source of truth in roles.ts)
  const maxIntrus = clampIntrusCounts(playerCount, {
    intrusCount: playerCount, undercoverCount, mrWhiteCount, undercoverEnabled, mrWhiteEnabled, randomSplit,
  }).intrusCount;

  // Save profiles to localStorage whenever names/avatars/colors change
  useEffect(() => {
    const profiles = names.slice(0, playerCount).map((name, i) => ({
      name: name.trim(),
      avatarEmoji: playerAvatars[i],
      avatarColor: playerColors[i],
    }));
    // Only save if at least one name is filled
    if (profiles.some((p) => p.name.length > 0)) {
      savePlayerProfiles(profiles);
    }
  }, [names, playerAvatars, playerColors, playerCount]);

  const handlePickAvatar = (emoji: string) => {
    if (editingAvatar === null) return;
    const next = [...playerAvatars];
    next[editingAvatar] = emoji;
    setPlayerAvatars(next);
  };

  const handlePickColor = (color: string) => {
    if (editingAvatar === null) return;
    const next = [...playerColors];
    next[editingAvatar] = color;
    setPlayerColors(next);
  };

  const movePlayer = useCallback((from: number, to: number) => {
    if (from === to) return;
    const move = <T,>(arr: T[]) => {
      const next = [...arr];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    };
    setNames(move);
    setPlayerAvatars(move);
    setPlayerColors(move);
  }, []);

  const removePlayer = useCallback((index: number) => {
    setNames((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      next.push('');
      return next;
    });
    setPlayerAvatars((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      next.push(AVATAR_EMOJIS[prev.length - 1] ?? AVATAR_EMOJIS[0]);
      return next;
    });
    setPlayerColors((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      next.push(AVATAR_COLORS[prev.length - 1] ?? AVATAR_COLORS[0]);
      return next;
    });
    setPlayerCount((c) => c - 1);
  }, []);

  // ── Drag & drop state ──
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLFormElement>(null);
  const dragStartY = useRef(0);

  const getItemIndexAtY = useCallback((clientY: number): number | null => {
    if (!listRef.current) return null;
    const items = listRef.current.querySelectorAll('[data-player-index]');
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (clientY < midY) return i;
    }
    return items.length - 1;
  }, []);

  const handleDragStart = useCallback((index: number, clientY: number) => {
    setDragIndex(index);
    setOverIndex(index);
    dragStartY.current = clientY;
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    const target = getItemIndexAtY(clientY);
    if (target !== null) setOverIndex(target);
  }, [getItemIndexAtY]);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      movePlayer(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, movePlayer]);

  const onDragMove = useCallback((e: PointerEvent | TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    handleDragMove(clientY);
  }, [handleDragMove]);

  useDragListeners(dragIndex !== null, onDragMove, handleDragEnd);

  const handleStart = () => {
    const trimmed = names.slice(0, playerCount).map((n) => n.trim());
    const emojis = playerAvatars.slice(0, playerCount);
    const colors = playerColors.slice(0, playerCount);
    startGame(trimmed, emojis, colors);
  };

  return (
    <GameLayout title="Nouvelle partie" onBack={() => setPhase('home')}>
      {/* Player count stepper */}
      <div className={styles.roleSection}>
        <span className={styles.roleLabel}>Combien de joueurs ?</span>
        <div className={styles.stepper}>
          <button
            className={styles.stepperBtn}
            onClick={() => setPlayerCount(playerCount - 1)}
            disabled={playerCount <= 3}
          >
            -
          </button>
          <span className={styles.stepperValue}>{playerCount}</span>
          <button
            className={styles.stepperBtn}
            onClick={() => setPlayerCount(playerCount + 1)}
            disabled={playerCount >= MAX_PLAYERS}
          >
            +
          </button>
        </div>
      </div>

      {/* Player names + avatar */}
      <div className={styles.sectionTitle}>
        Joueurs
        <span className={styles.groupBtns}>
          {groups.length > 0 && (
            <button className={styles.loadGroupBtn} onClick={() => setShowGroupPicker(true)}>
              📋 Charger
            </button>
          )}
          <button
            className={styles.loadGroupBtn}
            onClick={() => setShowCreateGroup(true)}
            disabled={filledPlayerCount < 3}
          >
            ➕ Créer groupe
          </button>
        </span>
      </div>
      <form className={styles.playerList} onSubmit={(e) => e.preventDefault()} ref={listRef}>
        {Array.from({ length: playerCount }, (_, i) => (
          <div
            key={i}
            data-player-index={i}
            className={[
              styles.nameInput,
              dragIndex === i ? styles.dragging : '',
              overIndex === i && dragIndex !== null && dragIndex !== i ? styles.dragOver : '',
            ].join(' ')}
          >
            <span
              className={styles.dragHandle}
              aria-label="Réordonner"
              onPointerDown={(e) => {
                e.preventDefault();
                handleDragStart(i, e.clientY);
              }}
              onTouchStart={(e) => {
                handleDragStart(i, e.touches[0].clientY);
              }}
            >
              ≡
            </span>
            <button
              type="button"
              className={styles.avatarBtn}
              onClick={() => setEditingAvatar(i)}
              aria-label={`Changer l'avatar du joueur ${i + 1}`}
              tabIndex={-1}
            >
              <PlayerAvatar
                emoji={playerAvatars[i]}
                color={playerColors[i]}
                size="small"
              />
            </button>
            <input
              className={styles.input}
              placeholder={`Joueur ${i + 1}`}
              value={names[i]}
              onChange={(e) => {
                const next = [...names];
                next[i] = e.target.value;
                setNames(next);
              }}
              maxLength={15}
              autoCapitalize="words"
              enterKeyHint={i < playerCount - 1 ? 'next' : 'done'}
            />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removePlayer(i)}
              disabled={playerCount <= 3}
              aria-label={`Supprimer le joueur ${i + 1}`}
              tabIndex={-1}
            >
              ✕
            </button>
          </div>
        ))}
      </form>

      {/* Intrus count stepper */}
      <div className={styles.roleSection}>
        <span className={styles.roleLabel}>🕵️ Intrus</span>
        <div className={styles.stepper}>
          <button
            className={styles.stepperBtn}
            onClick={() => setIntrusCount(intrusCount - 1)}
            disabled={intrusCount <= 1}
          >
            -
          </button>
          <span className={styles.stepperValue}>{intrusCount}</span>
          <button
            className={styles.stepperBtn}
            onClick={() => setIntrusCount(intrusCount + 1)}
            disabled={intrusCount >= maxIntrus}
          >
            +
          </button>
        </div>
      </div>

      {/* Random split toggle */}
      <button className={styles.toggle} onClick={() => setRandomSplit(!randomSplit)}>
        <div className={styles.toggleLabelWrap}>
          <span className={styles.toggleLabel}><span>🎲</span> Répartition aléatoire</span>
          <span className={styles.toggleSub}>Le jeu décide combien d'Undercovers et de Mr. White</span>
        </div>
        <span className={randomSplit ? styles.switchOn : styles.switch}>
          <span className={styles.switchKnob} />
        </span>
      </button>

      {/* Split slider — when not random */}
      {!randomSplit && (
        <div className={styles.splitSliderBox}>
          <span
            className={styles.splitSliderLabel}
            onClick={() => { setUndercoverEnabled(true); setMrWhiteEnabled(false); setUndercoverCount(intrusCount); setMrWhiteCount(0); }}
          >🥷 {undercoverCount}</span>
          <div className={styles.splitSliderWrap}>
            <input
              type="range"
              className={styles.splitSlider}
              min={0}
              max={intrusCount}
              step={1}
              value={undercoverCount}
              onChange={(e) => {
              const uc = Number(e.target.value);
              setUndercoverEnabled(uc > 0);
              setMrWhiteEnabled(uc < intrusCount);
              setUndercoverCount(uc);
              setMrWhiteCount(intrusCount - uc);
              }}
            />
            <div className={styles.splitSliderSegments}>
              {Array.from({ length: intrusCount }, (_, i) => (
                <div
                  key={i}
                  className={styles.splitSliderSegment}
                  style={{ background: i < undercoverCount ? '#6C5CE7' : '#FDCB6E' }}
                />
              ))}
            </div>
          </div>
          <span
            className={styles.splitSliderLabel}
            onClick={() => { setUndercoverEnabled(false); setMrWhiteEnabled(true); setMrWhiteCount(intrusCount); setUndercoverCount(0); }}
          >🎩 {mrWhiteCount}</span>
        </div>
      )}

      {/* Recap */}
      <div className={styles.startRecap}>
        <span className={styles.startRecapMain}>{playerCount} joueurs · {intrusCount} intrus</span>
        <span className={styles.startRecapSub}>
          {randomSplit
            ? 'répartition aléatoire entre Undercover et Mr. White'
            : mrWhiteCount === 0
              ? `${intrusCount} Undercover`
              : undercoverCount === 0
                ? `${intrusCount} Mr. White`
                : `${undercoverCount} Undercover · ${mrWhiteCount} Mr. White`}
        </span>
      </div>

      {/* Category */}
      <div className={styles.sectionTitle}>Catégorie</div>
      <div className={styles.categories}>
        <button
          className={selectedCategories.length === 0 ? styles.catBtnActive : styles.catBtn}
          onClick={() => setSelectedCategory(null)}
        >
          <span className={styles.catIcon}>🎲</span>
          Aléatoire
        </button>
        {CATEGORIES.map((cat) => {
          const empty = enabledPerCategory[cat.id] === 0;
          return (
            <button
              key={cat.id}
              className={
                empty
                  ? styles.catBtnDisabled
                  : selectedCategories.includes(cat.id)
                    ? styles.catBtnActive
                    : styles.catBtn
              }
              onClick={() => toggleCategory(cat.id)}
              disabled={empty}
            >
              <span className={styles.catCount}>
                {enabledPerCategory[cat.id]}/{totalPerCategory[cat.id]}
              </span>
              <span className={styles.catIcon}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
        {customPairsCount > 0 && (
          <button
            className={
              selectedCategories.includes('custom')
                ? styles.catBtnActive
                : styles.catBtn
            }
            onClick={() => toggleCategory('custom')}
            style={{ outline: '2px dashed var(--color-primary)', outlineOffset: '-2px' }}
          >
            <span className={styles.catCount}>{customPairsCount}</span>
            <span className={styles.catIcon}>✏️</span>
            Mes paires
          </button>
        )}
      </div>

      {/* Start */}
      <Button
        variant="primary"
        size="large"
        block
        icon="🚀"
        onClick={handleStart}
        disabled={!canStart}
        style={{ maxWidth: 320, opacity: canStart ? 1 : 0.5 }}
      >
        C'est parti !
      </Button>

      {/* Group picker overlay */}
      {showGroupPicker && (
        <div className={styles.groupPickerOverlay} onClick={() => setShowGroupPicker(false)}>
          <div className={styles.groupPickerSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.groupPickerTitle}>Charger un groupe</div>
            {groups.map((g) => {
              const members = resolveGroupMembers(g.playerIds, roster);
              return (
                <button
                  key={g.id}
                  className={styles.groupPickerItem}
                  onClick={() => handleLoadGroup(g)}
                >
                  <span className={styles.groupPickerName}>{g.name}</span>
                  <span className={styles.groupPickerCount}>{members.length} joueurs</span>
                  <div className={styles.groupPickerAvatars}>
                    {members.map((m) => (
                      <span key={m.id} className={styles.groupPickerAvatar}>
                        <AvatarEmoji value={m.avatarEmoji} size={20} />
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
            <Button variant="secondary" block onClick={() => setShowGroupPicker(false)} style={{ marginTop: '0.5rem' }}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Create group overlay */}
      {showCreateGroup && (
        <div className={styles.groupPickerOverlay} onClick={() => setShowCreateGroup(false)}>
          <div className={styles.groupPickerSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.groupPickerTitle}>Créer un groupe</div>
            <div className={styles.createGroupPreview}>
              {names.slice(0, playerCount).map((name, i) => {
                if (!name.trim()) return null;
                return (
                  <span key={i} className={styles.groupPlayerChip}>
                    <span className={styles.groupPlayerChipEmoji}><AvatarEmoji value={playerAvatars[i]} size={16} /></span>
                    {name.trim()}
                  </span>
                );
              })}
            </div>
            <input
              className={styles.createGroupInput}
              placeholder="Nom du groupe"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <Button
              variant="primary"
              block
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || filledPlayerCount < 3}
            >
              Enregistrer
            </Button>
            <Button variant="secondary" block onClick={() => setShowCreateGroup(false)} style={{ marginTop: '0.25rem' }}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Avatar picker bottom sheet */}
      {editingAvatar !== null && (
        <div className={styles.avatarPickerOverlay} onClick={() => setEditingAvatar(null)}>
          <div className={styles.avatarPickerSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.avatarPickerTitle}>
              Choisis ton avatar
            </div>
            <div className={styles.avatarGrid}>
              {AVATAR_EMOJIS.map((emoji) => {
                const takenByOther = activeAvatars.some(
                  (a, idx) => a === emoji && idx !== editingAvatar,
                );
                const isSelected = playerAvatars[editingAvatar] === emoji;
                return (
                  <button
                    key={emoji}
                    className={
                      takenByOther
                        ? styles.avatarOptionTaken
                        : isSelected
                          ? styles.avatarOptionSelected
                          : styles.avatarOption
                    }
                    style={{ backgroundColor: isSelected ? playerColors[editingAvatar] : undefined }}
                    onClick={() => handlePickAvatar(emoji)}
                    disabled={takenByOther}
                  >
                    <AvatarEmoji value={emoji} size={32} />
                  </button>
                );
              })}
            </div>

            {/* Color picker */}
            <div className={styles.avatarPickerTitle} style={{ marginTop: '1rem' }}>
              Choisis ta couleur
            </div>
            <div className={styles.avatarGrid}>
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  className={
                    playerColors[editingAvatar] === color
                      ? styles.avatarOptionSelected
                      : styles.avatarOption
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => handlePickColor(color)}
                >
                  {playerColors[editingAvatar] === color ? '✓' : ''}
                </button>
              ))}
            </div>

            <Button variant="primary" block onClick={() => setEditingAvatar(null)} style={{ marginTop: '1rem' }}>
              OK
            </Button>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
