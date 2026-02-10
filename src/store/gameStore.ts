import { create } from 'zustand';
import type { GameState, GamePhase } from '../types/game';
import { pickPair, createPlayers } from '../logic/gameEngine';
import { savePlayerProfiles, loadUndercoverCount, saveUndercoverCount, loadMrWhiteCount, saveMrWhiteCount, loadDisabledPairs, loadEasyMode, saveEasyMode, loadAntiCheat, saveAntiCheat } from '../lib/storage';
import type { AntiCheatSettings } from '../lib/storage';

interface GameActions {
  // Navigation
  setPhase: (phase: GamePhase) => void;
  goHome: () => void;

  // Setup
  setUndercoverCount: (count: number) => void;
  setMrWhiteCount: (count: number) => void;
  setEasyMode: (enabled: boolean) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleCategory: (category: string) => void;
  startGame: (names: string[], avatarEmojis: string[], avatarColors: string[]) => void;

  // Anti-cheat
  antiCheat: AntiCheatSettings;
  setAntiCheat: (settings: AntiCheatSettings) => void;

  // Reveal
  nextReveal: () => void;

  // Restart
  restartWithSamePlayers: () => void;
}

const initialState: GameState = {
  phase: 'home',
  players: [],
  currentPair: null,
  currentPlayerIndex: 0,
  undercoverCount: loadUndercoverCount(),
  mrWhiteCount: loadMrWhiteCount(),
  easyMode: loadEasyMode(),
  selectedCategories: [],
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  antiCheat: loadAntiCheat(),

  setAntiCheat: (settings) => {
    saveAntiCheat(settings);
    set({ antiCheat: settings });
  },

  setPhase: (phase) => set({ phase }),

  goHome: () => set({
    phase: 'home',
    players: [],
    currentPair: null,
    currentPlayerIndex: 0,
    undercoverCount: get().undercoverCount,
    mrWhiteCount: get().mrWhiteCount,
    easyMode: get().easyMode,
    selectedCategories: [],
  }),

  setUndercoverCount: (count) => {
    saveUndercoverCount(count);
    set({ undercoverCount: count });
  },

  setMrWhiteCount: (count) => {
    saveMrWhiteCount(count);
    set({ mrWhiteCount: count });
  },

  setEasyMode: (enabled) => {
    saveEasyMode(enabled);
    set({ easyMode: enabled });
  },

  setSelectedCategory: (category) => {
    if (category === null) {
      set({ selectedCategories: [] });
    } else {
      set({ selectedCategories: [category] });
    }
  },

  toggleCategory: (category) => {
    const current = get().selectedCategories;
    if (current.includes(category)) {
      set({ selectedCategories: current.filter((c) => c !== category) });
    } else {
      set({ selectedCategories: [...current, category] });
    }
  },

  startGame: (names, avatarEmojis, avatarColors) => {
    const { undercoverCount, mrWhiteCount, selectedCategories } = get();
    const disabledPairs = loadDisabledPairs();
    const pair = pickPair(selectedCategories, disabledPairs);
    const players = createPlayers(names, avatarEmojis, avatarColors, pair, undercoverCount, mrWhiteCount);
    // Persist player profiles so they survive app restarts
    savePlayerProfiles(
      names.map((name, i) => ({ name, avatarEmoji: avatarEmojis[i], avatarColor: avatarColors[i] })),
    );
    set({
      phase: 'reveal',
      players,
      currentPair: pair,
      currentPlayerIndex: 0,
    });
  },

  nextReveal: () => {
    const { currentPlayerIndex, players } = get();
    const next = currentPlayerIndex + 1;
    if (next >= players.length) {
      set({ phase: 'discussion', currentPlayerIndex: 0 });
    } else {
      set({ currentPlayerIndex: next });
    }
  },

  restartWithSamePlayers: () => {
    const { players, undercoverCount, mrWhiteCount, selectedCategories } = get();
    const names = players.map((p) => p.name);
    const emojis = players.map((p) => p.avatarEmoji);
    const colors = players.map((p) => p.avatarColor);
    const disabledPairs = loadDisabledPairs();
    const pair = pickPair(selectedCategories, disabledPairs);
    const newPlayers = createPlayers(names, emojis, colors, pair, undercoverCount, mrWhiteCount);
    // Keep profiles in sync for app restarts
    savePlayerProfiles(
      names.map((name, i) => ({ name, avatarEmoji: emojis[i], avatarColor: colors[i] })),
    );
    set({
      phase: 'reveal',
      players: newPlayers,
      currentPair: pair,
      currentPlayerIndex: 0,
    });
  },
}));
