import { useState, useEffect } from 'react';
import type { RosterPlayer, PlayerGroup } from '../../types/game';
import { AVATAR_EMOJIS, AVATAR_COLORS } from '../../types/game';
import { loadRoster, saveRoster, loadGroups, saveGroups } from '../../lib/storage';
import { useGameStore } from '../../store/gameStore';
import PairBrowser from './PairBrowser';
import PlayerAvatar, { AvatarEmoji } from '../ui/PlayerAvatar';
import styles from './Settings.module.css';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'players' | 'groups' | 'pairs' | 'anticheat'>('players');
  const [roster, setRoster] = useState<RosterPlayer[]>(() => loadRoster());
  const [groups, setGroups] = useState<PlayerGroup[]>(() => loadGroups());
  const { antiCheat, setAntiCheat } = useGameStore();

  // Add player form state
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState<string>(AVATAR_EMOJIS[0]);
  const [newColor, setNewColor] = useState<string>(AVATAR_COLORS[0]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Edit player state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);

  // Add group form state
  const [groupName, setGroupName] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  // Edit group state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupPlayerIds, setEditGroupPlayerIds] = useState<Set<string>>(new Set());

  // Persist roster to localStorage
  useEffect(() => {
    saveRoster(roster);
  }, [roster]);

  // Persist groups to localStorage
  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  function addPlayer() {
    if (!newName.trim()) return;
    const player: RosterPlayer = {
      id: Date.now().toString(36),
      name: newName.trim(),
      avatarEmoji: newEmoji,
      avatarColor: newColor,
    };
    setRoster((prev) => [...prev, player]);
    setNewName('');
    setNewEmoji(AVATAR_EMOJIS[0]);
    setNewColor(AVATAR_COLORS[0]);
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  }

  function deletePlayer(id: string) {
    setRoster((prev) => prev.filter((p) => p.id !== id));
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        playerIds: g.playerIds.filter((pid) => pid !== id),
      }))
    );
    if (editingPlayerId === id) setEditingPlayerId(null);
  }

  function startEditPlayer(p: RosterPlayer) {
    setEditingPlayerId(p.id);
    setEditName(p.name);
    setEditEmoji(p.avatarEmoji);
    setEditColor(p.avatarColor);
    setShowEditEmojiPicker(false);
    setShowEditColorPicker(false);
  }

  function saveEditPlayer() {
    if (!editingPlayerId || !editName.trim()) return;
    setRoster((prev) =>
      prev.map((p) =>
        p.id === editingPlayerId
          ? { ...p, name: editName.trim(), avatarEmoji: editEmoji, avatarColor: editColor }
          : p,
      ),
    );
    setEditingPlayerId(null);
  }

  function cancelEditPlayer() {
    setEditingPlayerId(null);
  }

  function swapRoster(a: number, b: number) {
    setRoster((prev) => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function addGroup() {
    if (!groupName.trim() || selectedPlayerIds.size < 3) return;
    const group: PlayerGroup = {
      id: Date.now().toString(36),
      name: groupName.trim(),
      playerIds: Array.from(selectedPlayerIds),
    };
    setGroups((prev) => [...prev, group]);
    setGroupName('');
    setSelectedPlayerIds(new Set());
  }

  function deleteGroup(id: string) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (editingGroupId === id) setEditingGroupId(null);
  }

  function startEditGroup(g: PlayerGroup) {
    setEditingGroupId(g.id);
    setEditGroupName(g.name);
    setEditGroupPlayerIds(new Set(g.playerIds));
  }

  function saveEditGroup() {
    if (!editingGroupId || !editGroupName.trim() || editGroupPlayerIds.size < 3) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === editingGroupId
          ? { ...g, name: editGroupName.trim(), playerIds: Array.from(editGroupPlayerIds) }
          : g,
      ),
    );
    setEditingGroupId(null);
  }

  function cancelEditGroup() {
    setEditingGroupId(null);
  }

  function swapGroupMember(groupId: string, a: number, b: number) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const ids = [...g.playerIds];
        [ids[a], ids[b]] = [ids[b], ids[a]];
        return { ...g, playerIds: ids };
      }),
    );
  }

  function renderPlayersTab() {
    return (
      <div className={styles.rosterSection}>
        {/* Existing players list */}
        {roster.length === 0 && (
          <div className={styles.rosterEmpty}>
            Aucun joueur enregistré.<br />
            Ajoute des joueurs pour créer des groupes !
          </div>
        )}
        {roster.map((p, rosterIdx) => (
          editingPlayerId === p.id ? (
            /* Inline edit form */
            <div key={p.id} className={styles.rosterRow} style={{ flexWrap: 'wrap' }}>
              <button
                className={styles.addPlayerAvatarBtn}
                onClick={() => { setShowEditEmojiPicker(!showEditEmojiPicker); setShowEditColorPicker(false); }}
              >
                <PlayerAvatar emoji={editEmoji} color={editColor} size="small" />
              </button>
              <input
                className={styles.addPlayerInput}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={15}
                autoCapitalize="words"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') saveEditPlayer(); }}
              />
              <button className={styles.addPlayerBtn} onClick={saveEditPlayer} disabled={!editName.trim()}>
                ✓
              </button>
              <button className={styles.rosterDeleteBtn} onClick={cancelEditPlayer} style={{ color: 'var(--color-text-light)' }}>
                ✕
              </button>
              {showEditEmojiPicker && (
                <div className={styles.miniAvatarPicker}>
                  <div className={styles.miniPickerLabel}>Avatar</div>
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className={editEmoji === emoji ? styles.miniAvatarOptionSelected : styles.miniAvatarOption}
                      onClick={() => { setEditEmoji(emoji); setShowEditEmojiPicker(false); setShowEditColorPicker(true); }}
                    >
                      <AvatarEmoji value={emoji} size={24} />
                    </button>
                  ))}
                </div>
              )}
              {showEditColorPicker && (
                <div className={styles.miniAvatarPicker}>
                  <div className={styles.miniPickerLabel}>Couleur</div>
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      className={editColor === color ? styles.miniColorOptionSelected : styles.miniColorOption}
                      style={{ backgroundColor: color }}
                      onClick={() => { setEditColor(color); setShowEditColorPicker(false); }}
                    >
                      {editColor === color ? '✓' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Normal display row */
            <div key={p.id} className={styles.rosterRow}>
              <div className={styles.reorderBtns}>
                <button className={styles.reorderBtn} onClick={() => swapRoster(rosterIdx, rosterIdx - 1)} disabled={rosterIdx === 0} aria-label="Monter">▲</button>
                <button className={styles.reorderBtn} onClick={() => swapRoster(rosterIdx, rosterIdx + 1)} disabled={rosterIdx === roster.length - 1} aria-label="Descendre">▼</button>
              </div>
              <div className={styles.rosterAvatar}>
                <PlayerAvatar emoji={p.avatarEmoji} color={p.avatarColor} size="small" />
              </div>
              <span className={styles.rosterName}>{p.name}</span>
              <button className={styles.rosterDeleteBtn} onClick={() => startEditPlayer(p)} style={{ color: 'var(--color-primary)', opacity: 0.5 }}>
                ✎
              </button>
              <button className={styles.rosterDeleteBtn} onClick={() => deletePlayer(p.id)}>✕</button>
            </div>
          )
        ))}

        {/* Add player form */}
        <div className={styles.addPlayerForm}>
          <button
            className={styles.addPlayerAvatarBtn}
            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowColorPicker(false); }}
          >
            <PlayerAvatar emoji={newEmoji} color={newColor} size="small" />
          </button>
          <input
            className={styles.addPlayerInput}
            placeholder="Nouveau joueur"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={15}
            autoCapitalize="words"
            onKeyDown={(e) => { if (e.key === 'Enter') addPlayer(); }}
          />
          <button
            className={styles.addPlayerBtn}
            onClick={addPlayer}
            disabled={!newName.trim()}
          >
            +
          </button>
        </div>

        {/* Inline emoji picker */}
        {showEmojiPicker && (
          <div className={styles.miniAvatarPicker}>
            <div className={styles.miniPickerLabel}>Avatar</div>
            {AVATAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className={newEmoji === emoji ? styles.miniAvatarOptionSelected : styles.miniAvatarOption}
                onClick={() => { setNewEmoji(emoji); setShowEmojiPicker(false); setShowColorPicker(true); }}
              >
                <AvatarEmoji value={emoji} size={24} />
              </button>
            ))}
          </div>
        )}

        {/* Inline color picker */}
        {showColorPicker && (
          <div className={styles.miniAvatarPicker}>
            <div className={styles.miniPickerLabel}>Couleur</div>
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                className={newColor === color ? styles.miniColorOptionSelected : styles.miniColorOption}
                style={{ backgroundColor: color }}
                onClick={() => { setNewColor(color); setShowColorPicker(false); }}
              >
                {newColor === color ? '✓' : ''}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderGroupsTab() {
    return (
      <div className={styles.groupSection}>
        {groups.length === 0 && (
          <div className={styles.groupEmpty}>
            Aucun groupe créé.<br />
            Crée un groupe pour lancer une partie plus vite !
          </div>
        )}
        {groups.map((g) => {
          const members = g.playerIds
            .map((pid) => roster.find((r) => r.id === pid))
            .filter(Boolean) as RosterPlayer[];

          if (editingGroupId === g.id) {
            /* Inline edit form for this group */
            return (
              <div key={g.id} className={styles.addGroupForm}>
                <div className={styles.addGroupRow}>
                  <input
                    className={styles.addGroupInput}
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    maxLength={20}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEditGroup(); }}
                  />
                  <button
                    className={styles.addGroupBtn}
                    onClick={saveEditGroup}
                    disabled={!editGroupName.trim() || editGroupPlayerIds.size < 3}
                  >
                    ✓
                  </button>
                  <button
                    className={styles.groupDeleteBtn}
                    onClick={cancelEditGroup}
                    style={{ color: 'var(--color-text-light)' }}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.selectPlayersLabel}>
                  {editGroupPlayerIds.size} joueur{editGroupPlayerIds.size > 1 ? 's' : ''} (min 3, max 16) :
                </div>
                <div className={styles.selectPlayersList}>
                  {roster.map((p) => {
                    const isSelected = editGroupPlayerIds.has(p.id);
                    return (
                      <button
                        key={p.id}
                        className={isSelected ? styles.selectPlayerBtnActive : styles.selectPlayerBtn}
                        onClick={() => {
                          setEditGroupPlayerIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(p.id)) {
                              next.delete(p.id);
                            } else if (next.size < 16) {
                              next.add(p.id);
                            }
                            return next;
                          });
                        }}
                      >
                        <span className={styles.selectPlayerEmoji}>{p.avatarEmoji}</span>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div key={g.id} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <span className={styles.groupName}>{g.name}</span>
                <span className={styles.groupCount}>{members.length} joueurs</span>
                <button className={styles.groupDeleteBtn} onClick={() => startEditGroup(g)} style={{ color: 'var(--color-primary)', opacity: 0.5 }}>
                  ✎
                </button>
                <button className={styles.groupDeleteBtn} onClick={() => deleteGroup(g.id)}>✕</button>
              </div>
              <div className={styles.groupPlayers}>
                {members.map((m, mIdx) => (
                  <span key={m.id} className={styles.groupPlayerChip}>
                    <span className={styles.groupPlayerChipEmoji}><AvatarEmoji value={m.avatarEmoji} size={16} /></span>
                    {m.name}
                    <span className={styles.chipReorderBtns}>
                      <button className={styles.chipReorderBtn} onClick={() => swapGroupMember(g.id, mIdx, mIdx - 1)} disabled={mIdx === 0} aria-label="Monter">▲</button>
                      <button className={styles.chipReorderBtn} onClick={() => swapGroupMember(g.id, mIdx, mIdx + 1)} disabled={mIdx === members.length - 1} aria-label="Descendre">▼</button>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Add group form */}
        <div className={styles.addGroupForm}>
          <div className={styles.addGroupRow}>
            <input
              className={styles.addGroupInput}
              placeholder="Nom du groupe"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={20}
            />
            <button
              className={styles.addGroupBtn}
              onClick={addGroup}
              disabled={!groupName.trim() || selectedPlayerIds.size < 3}
            >
              Créer
            </button>
          </div>

          {roster.length === 0 ? (
            <div className={styles.noRosterHint}>
              Ajoute d'abord des joueurs dans l'onglet Joueurs
            </div>
          ) : (
            <>
              <div className={styles.selectPlayersLabel}>
                Sélectionne 3 à 16 joueurs :
              </div>
              <div className={styles.selectPlayersList}>
                {roster.map((p) => {
                  const isSelected = selectedPlayerIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      className={isSelected ? styles.selectPlayerBtnActive : styles.selectPlayerBtn}
                      onClick={() => {
                        setSelectedPlayerIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(p.id)) {
                            next.delete(p.id);
                          } else if (next.size < 16) {
                            next.add(p.id);
                          }
                          return next;
                        });
                      }}
                    >
                      <span className={styles.selectPlayerEmoji}>{p.avatarEmoji}</span>
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  function toggleAntiCheat(key: keyof typeof antiCheat) {
    setAntiCheat({ ...antiCheat, [key]: !antiCheat[key] });
  }

  function renderAntiCheatTab() {
    return (
      <div className={styles.antiCheatSection}>
        {/* 1. Allow peek */}
        <button
          className={styles.antiCheatItem}
          onClick={() => toggleAntiCheat('allowPeek')}
        >
          <span className={styles.antiCheatIcon}>🔍</span>
          <div className={styles.antiCheatLabel}>
            <span className={styles.antiCheatName}>Revoir ma carte</span>
            <span className={styles.antiCheatDesc}>Chaque joueur peut revoir sa carte pendant la discussion</span>
          </div>
          <span className={antiCheat.allowPeek ? styles.antiCheatSwitchOn : styles.antiCheatSwitch}>
            <span className={styles.antiCheatSwitchKnob} />
          </span>
        </button>

        {/* 2. Peek alarm */}
        <button
          className={`${styles.antiCheatItem} ${!antiCheat.allowPeek ? styles.antiCheatDisabled : ''}`}
          onClick={() => toggleAntiCheat('peekAlarm')}
          disabled={!antiCheat.allowPeek}
        >
          <span className={styles.antiCheatIcon}>🚨</span>
          <div className={styles.antiCheatLabel}>
            <span className={styles.antiCheatName}>Alarme revoir carte</span>
            <span className={styles.antiCheatDesc}>Déclenche une alarme sonore et visuelle avant d'afficher la carte</span>
          </div>
          <span className={antiCheat.peekAlarm && antiCheat.allowPeek ? styles.antiCheatSwitchOn : styles.antiCheatSwitch}>
            <span className={styles.antiCheatSwitchKnob} />
          </span>
        </button>

        {/* 3. Allow show all */}
        <button
          className={styles.antiCheatItem}
          onClick={() => toggleAntiCheat('allowShowAll')}
        >
          <span className={styles.antiCheatIcon}>👀</span>
          <div className={styles.antiCheatLabel}>
            <span className={styles.antiCheatName}>Voir toutes les cartes</span>
            <span className={styles.antiCheatDesc}>Permet de révéler toutes les cartes d'un coup (fin de partie)</span>
          </div>
          <span className={antiCheat.allowShowAll ? styles.antiCheatSwitchOn : styles.antiCheatSwitch}>
            <span className={styles.antiCheatSwitchKnob} />
          </span>
        </button>

        {/* 4. Show all alarm */}
        <button
          className={`${styles.antiCheatItem} ${!antiCheat.allowShowAll ? styles.antiCheatDisabled : ''}`}
          onClick={() => toggleAntiCheat('showAllAlarm')}
          disabled={!antiCheat.allowShowAll}
        >
          <span className={styles.antiCheatIcon}>🚨</span>
          <div className={styles.antiCheatLabel}>
            <span className={styles.antiCheatName}>Alarme toutes les cartes</span>
            <span className={styles.antiCheatDesc}>Déclenche une alarme avant de révéler toutes les cartes</span>
          </div>
          <span className={antiCheat.showAllAlarm && antiCheat.allowShowAll ? styles.antiCheatSwitchOn : styles.antiCheatSwitch}>
            <span className={styles.antiCheatSwitchKnob} />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Paramètres</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={activeTab === 'players' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('players')}
          >
            <span className={styles.tabIcon}>👥</span>
            Joueurs
          </button>
          <button
            className={activeTab === 'groups' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('groups')}
          >
            <span className={styles.tabIcon}>📋</span>
            Groupes
          </button>
          <button
            className={activeTab === 'pairs' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('pairs')}
          >
            <span className={styles.tabIcon}>🃏</span>
            Paires
          </button>
          <button
            className={activeTab === 'anticheat' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('anticheat')}
          >
            <span className={styles.tabIcon}>🛡️</span>
            Anti-triche
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'players' && renderPlayersTab()}
          {activeTab === 'groups' && renderGroupsTab()}
          {activeTab === 'pairs' && <PairBrowser embedded />}
          {activeTab === 'anticheat' && renderAntiCheatTab()}
        </div>
      </div>
    </div>
  );
}
