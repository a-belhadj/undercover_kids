import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CATEGORIES, emojiPairs } from '../../data/emojiPairs';
import { AVATAR_EMOJIS, AVATAR_COLORS } from '../../types/game';
import { loadPlayerProfiles, savePlayerProfiles, loadDisabledPairs, loadRoster, saveRoster, loadGroups, saveGroups } from '../../lib/storage';
import type { RosterPlayer, PlayerGroup } from '../../types/game';
import GameLayout from '../layout/GameLayout';
import Button from '../ui/Button';
import PlayerAvatar, { AvatarEmoji } from '../ui/PlayerAvatar';
import styles from './SetupScreen.module.css';

const MAX_PLAYERS = 16;

export default function SetupScreen() {
  const { setPhase, startGame, undercoverCount, setUndercoverCount, mrWhiteCount, setMrWhiteCount, easyMode, setEasyMode, selectedCategories, toggleCategory, setSelectedCategory } =
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
  // Clamp undercover + mrWhite when playerCount changes (never more than half, at least 1 total)
  useEffect(() => {
    const maxSpecial = Math.floor(playerCount / 2);
    let uc = undercoverCount;
    let mw = mrWhiteCount;
    // Clamp to fit within maxSpecial
    if (uc + mw > maxSpecial) {
      uc = Math.min(uc, maxSpecial);
      mw = Math.min(mw, maxSpecial - uc);
    }
    // Ensure at least 1 special role
    if (uc + mw < 1) {
      uc = 1;
    }
    if (uc !== undercoverCount) setUndercoverCount(uc);
    if (mw !== mrWhiteCount) setMrWhiteCount(mw);
  }, [playerCount, undercoverCount, mrWhiteCount, setUndercoverCount, setMrWhiteCount]);

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
    const members = group.playerIds
      .map((pid) => roster.find((r) => r.id === pid))
      .filter(Boolean) as RosterPlayer[];
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
          id: Math.random().toString(36).substring(2, 10),
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
      id: Math.random().toString(36).substring(2, 10),
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

  // Max special roles = floor(playerCount / 2) — civils always majority
  // Min: at least 1 of either undercover or mrWhite
  const maxSpecial = Math.floor(playerCount / 2);
  const maxUndercover = maxSpecial - mrWhiteCount;
  const maxMrWhite = maxSpecial - undercoverCount;
  const minUndercover = mrWhiteCount >= 1 ? 0 : 1;
  const minMrWhite = 0; // mrWhite can always be 0

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
        {hasSaved && (
          <span className={styles.savedBadge}>restaurés</span>
        )}
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
      <form className={styles.playerList} onSubmit={(e) => e.preventDefault()}>
        {Array.from({ length: playerCount }, (_, i) => (
          <div key={i} className={styles.nameInput}>
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
          </div>
        ))}
      </form>

      {/* Undercover count stepper */}
      <div className={styles.roleSection}>
        <span className={styles.roleLabel}>🥷 Undercovers</span>
        <div className={styles.stepper}>
          <button
            className={styles.stepperBtn}
            onClick={() => setUndercoverCount(undercoverCount - 1)}
            disabled={undercoverCount <= minUndercover}
          >
            -
          </button>
          <span className={styles.stepperValue}>{undercoverCount}</span>
          <button
            className={styles.stepperBtn}
            onClick={() => setUndercoverCount(undercoverCount + 1)}
            disabled={undercoverCount >= maxUndercover}
          >
            +
          </button>
        </div>
      </div>

      {/* Mr. White count stepper */}
      <div className={styles.roleSection}>
        <span className={styles.roleLabel}>🎩 Mr. White</span>
        <div className={styles.stepper}>
          <button
            className={styles.stepperBtn}
            onClick={() => setMrWhiteCount(mrWhiteCount - 1)}
            disabled={mrWhiteCount <= minMrWhite || (mrWhiteCount <= 1 && undercoverCount === 0)}
          >
            -
          </button>
          <span className={styles.stepperValue}>{mrWhiteCount}</span>
          <button
            className={styles.stepperBtn}
            onClick={() => setMrWhiteCount(mrWhiteCount + 1)}
            disabled={mrWhiteCount >= maxMrWhite}
          >
            +
          </button>
        </div>
      </div>

      {/* Easy mode toggle */}
      <button
        className={styles.toggle}
        onClick={() => setEasyMode(!easyMode)}
        aria-label={easyMode ? 'Désactiver le mode facile' : 'Activer le mode facile'}
      >
        <div className={styles.toggleLabelWrap}>
          <span className={styles.toggleLabel}>
            <span>🎓</span> Mode facile
          </span>
          <span className={styles.toggleSub}>
            Affiche le rôle (Civil 🟢 / Undercover 🥷) en plus de l'image
          </span>
        </div>
        <span className={easyMode ? styles.switchOn : styles.switch}>
          <span className={styles.switchKnob} />
        </span>
      </button>

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
              const members = g.playerIds
                .map((pid) => roster.find((r) => r.id === pid))
                .filter(Boolean) as RosterPlayer[];
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
