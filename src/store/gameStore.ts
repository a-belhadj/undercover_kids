import { create } from 'zustand';
import type { GameState, GamePhase } from '../types/game';
import { pickPair, createPlayers, buildSpeakingOrder } from '../logic/gameEngine';
import { savePlayerProfiles, loadUndercoverCount, saveUndercoverCount, loadMrWhiteCount, saveMrWhiteCount, loadDisabledPairs, saveDisabledPairs, loadEasyMode, saveEasyMode, loadSelectedCategories, saveSelectedCategories, loadMrWhiteCannotStart, saveMrWhiteCannotStart, loadAntiCheat, saveAntiCheat } from '../lib/storage';
import type { AntiCheatSettings } from '../lib/storage';

interface GameActions {
  // Navigation
  setPhase: (phase: GamePhase) => void;
  goHome: () => void;

  // Setup
  setUndercoverCount: (count: number) => void;
  setMrWhiteCount: (count: number) => void;
  setEasyMode: (enabled: boolean) => void;
  setMrWhiteCannotStart: (enabled: boolean) => void;
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
  disableCurrentPairAndRestart: () => void;
}

const initialState: GameState = {
  phase: 'home',
  players: [],
  currentPair: null,
  currentPlayerIndex: 0,
  speakingOrder: [],
  undercoverCount: loadUndercoverCount(),
  mrWhiteCount: loadMrWhiteCount(),
  easyMode: loadEasyMode(),
  selectedCategories: loadSelectedCategories(),
  mrWhiteCannotStart: loadMrWhiteCannotStart(),
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
    speakingOrder: [],
    undercoverCount: get().undercoverCount,
    mrWhiteCount: get().mrWhiteCount,
    easyMode: get().easyMode,
    selectedCategories: get().selectedCategories,
    mrWhiteCannotStart: get().mrWhiteCannotStart,
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

  setMrWhiteCannotStart: (enabled) => {
    saveMrWhiteCannotStart(enabled);
    set({ mrWhiteCannotStart: enabled });
  },

  setSelectedCategory: (category) => {
    if (category === null) {
      saveSelectedCategories([]);
      set({ selectedCategories: [] });
    } else {
      saveSelectedCategories([category]);
      set({ selectedCategories: [category] });
    }
  },

  toggleCategory: (category) => {
    const current = get().selectedCategories;
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    saveSelectedCategories(next);
    set({ selectedCategories: next });
  },

  startGame: (names, avatarEmojis, avatarColors) => {
    const { undercoverCount, mrWhiteCount, selectedCategories, mrWhiteCannotStart } = get();
    const disabledPairs = loadDisabledPairs();
    const pair = pickPair(selectedCategories, disabledPairs);
    const players = createPlayers(names, avatarEmojis, avatarColors, pair, undercoverCount, mrWhiteCount);
    const speakingOrder = buildSpeakingOrder(players, mrWhiteCannotStart);
    // Persist player profiles so they survive app restarts
    savePlayerProfiles(
      names.map((name, i) => ({ name, avatarEmoji: avatarEmojis[i], avatarColor: avatarColors[i] })),
    );
    set({
      phase: 'reveal',
      players,
      currentPair: pair,
      currentPlayerIndex: 0,
      speakingOrder,
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
    const { players, undercoverCount, mrWhiteCount, selectedCategories, mrWhiteCannotStart } = get();
    const names = players.map((p) => p.name);
    const emojis = players.map((p) => p.avatarEmoji);
    const colors = players.map((p) => p.avatarColor);
    const disabledPairs = loadDisabledPairs();
    const pair = pickPair(selectedCategories, disabledPairs);
    const newPlayers = createPlayers(names, emojis, colors, pair, undercoverCount, mrWhiteCount);
    const speakingOrder = buildSpeakingOrder(newPlayers, mrWhiteCannotStart);
    // Keep profiles in sync for app restarts
    savePlayerProfiles(
      names.map((name, i) => ({ name, avatarEmoji: emojis[i], avatarColor: colors[i] })),
    );
    set({
      phase: 'reveal',
      players: newPlayers,
      currentPair: pair,
      currentPlayerIndex: 0,
      speakingOrder,
    });
  },

  disableCurrentPairAndRestart: () => {
    const { currentPair, players, undercoverCount, mrWhiteCount, selectedCategories, mrWhiteCannotStart } = get();
    // Add current pair to disabled list
    if (currentPair) {
      const disabled = loadDisabledPairs();
      if (!disabled.includes(currentPair.id)) {
        disabled.push(currentPair.id);
        saveDisabledPairs(disabled);
      }
    }
    // Restart with same players but a new pair
    const names = players.map((p) => p.name);
    const emojis = players.map((p) => p.avatarEmoji);
    const colors = players.map((p) => p.avatarColor);
    const disabledPairs = loadDisabledPairs();
    const pair = pickPair(selectedCategories, disabledPairs);
    const newPlayers = createPlayers(names, emojis, colors, pair, undercoverCount, mrWhiteCount);
    const speakingOrder = buildSpeakingOrder(newPlayers, mrWhiteCannotStart);
    set({
      phase: 'reveal',
      players: newPlayers,
      currentPair: pair,
      currentPlayerIndex: 0,
      speakingOrder,
    });
  },
}));
