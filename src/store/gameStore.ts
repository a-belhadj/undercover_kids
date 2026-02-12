import { create } from 'zustand';
import type { GameState, GamePhase, PairDisplayMode, Player, CheatLog } from '../types/game';
import { pickPair, createPlayers, buildSpeakingOrder, checkGameOver } from '../logic/gameEngine';
import { computeFinalCounts } from '../logic/roles';
import { savePlayerProfiles, loadUndercoverCount, saveUndercoverCount, loadMrWhiteCount, saveMrWhiteCount, loadDisabledPairs, saveDisabledPairs, loadEasyMode, saveEasyMode, loadSelectedCategories, saveSelectedCategories, loadMrWhiteCannotStart, saveMrWhiteCannotStart, loadAntiCheat, saveAntiCheat, loadIntrusCount, saveIntrusCount, loadUndercoverEnabled, saveUndercoverEnabled, loadMrWhiteEnabled, saveMrWhiteEnabled, loadRandomSplit, saveRandomSplit, loadPairDisplayMode, savePairDisplayMode } from '../lib/storage';
import type { AntiCheatSettings } from '../lib/storage';

interface GameActions {
  // Navigation
  setPhase: (phase: GamePhase) => void;
  goHome: () => void;

  // Setup
  setUndercoverCount: (count: number) => void;
  setMrWhiteCount: (count: number) => void;
  setIntrusCount: (count: number) => void;
  setUndercoverEnabled: (enabled: boolean) => void;
  setMrWhiteEnabled: (enabled: boolean) => void;
  setRandomSplit: (enabled: boolean) => void;
  setEasyMode: (enabled: boolean) => void;
  setMrWhiteCannotStart: (enabled: boolean) => void;
  setPairDisplayMode: (mode: PairDisplayMode) => void;
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
  disableCurrentPairAndRestart: (firstPlayerIndex?: number) => void;

  // Elimination
  eliminatePlayer: (playerIndex: number) => void;

  // Cheat tracking
  updateCheatLog: (log: CheatLog) => void;
}

function extractPlayerProps(players: Player[]) {
  return {
    names: players.map((p) => p.name),
    emojis: players.map((p) => p.avatarEmoji),
    colors: players.map((p) => p.avatarColor),
  };
}

const initialState: GameState = {
  phase: 'home',
  players: [],
  currentPair: null,
  currentPlayerIndex: 0,
  speakingOrder: [],
  winner: null,
  cheatLog: { peekCounts: {}, showAllCount: 0 },
  undercoverCount: loadUndercoverCount(),
  mrWhiteCount: loadMrWhiteCount(),
  intrusCount: loadIntrusCount(),
  undercoverEnabled: loadUndercoverEnabled(),
  mrWhiteEnabled: loadMrWhiteEnabled(),
  randomSplit: loadRandomSplit(),
  easyMode: loadEasyMode(),
  selectedCategories: loadSelectedCategories(),
  mrWhiteCannotStart: loadMrWhiteCannotStart(),
  pairDisplayMode: loadPairDisplayMode(),
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
    winner: null,
    cheatLog: { peekCounts: {}, showAllCount: 0 },
    undercoverCount: get().undercoverCount,
    mrWhiteCount: get().mrWhiteCount,
    intrusCount: get().intrusCount,
    undercoverEnabled: get().undercoverEnabled,
    mrWhiteEnabled: get().mrWhiteEnabled,
    randomSplit: get().randomSplit,
    easyMode: get().easyMode,
    selectedCategories: get().selectedCategories,
    mrWhiteCannotStart: get().mrWhiteCannotStart,
    pairDisplayMode: get().pairDisplayMode,
  }),

  setUndercoverCount: (count) => {
    saveUndercoverCount(count);
    set({ undercoverCount: count });
  },

  setMrWhiteCount: (count) => {
    saveMrWhiteCount(count);
    set({ mrWhiteCount: count });
  },

  setIntrusCount: (count) => {
    saveIntrusCount(count);
    set({ intrusCount: count });
  },

  setUndercoverEnabled: (enabled) => {
    saveUndercoverEnabled(enabled);
    set({ undercoverEnabled: enabled });
  },

  setMrWhiteEnabled: (enabled) => {
    saveMrWhiteEnabled(enabled);
    set({ mrWhiteEnabled: enabled });
  },

  setRandomSplit: (enabled) => {
    saveRandomSplit(enabled);
    set({ randomSplit: enabled });
  },

  setEasyMode: (enabled) => {
    saveEasyMode(enabled);
    set({ easyMode: enabled });
  },

  setMrWhiteCannotStart: (enabled) => {
    saveMrWhiteCannotStart(enabled);
    set({ mrWhiteCannotStart: enabled });
  },

  setPairDisplayMode: (mode) => {
    savePairDisplayMode(mode);
    set({ pairDisplayMode: mode });
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
    const state = get();
    const { selectedCategories, mrWhiteCannotStart } = state;
    const { finalUC, finalMW } = computeFinalCounts(state);
    const disabledPairs = loadDisabledPairs();
    const pair = pickPair(selectedCategories, disabledPairs);
    const players = createPlayers(names, avatarEmojis, avatarColors, pair, finalUC, finalMW);
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
      winner: null,
      cheatLog: { peekCounts: {}, showAllCount: 0 },
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
    const state = get();
    const { players, selectedCategories, mrWhiteCannotStart } = state;
    const { finalUC, finalMW } = computeFinalCounts(state);
    const { names, emojis, colors } = extractPlayerProps(players);
    const disabledPairs = loadDisabledPairs();
    const pair = pickPair(selectedCategories, disabledPairs);
    const newPlayers = createPlayers(names, emojis, colors, pair, finalUC, finalMW);
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
      winner: null,
      cheatLog: { peekCounts: {}, showAllCount: 0 },
    });
  },

  disableCurrentPairAndRestart: (firstPlayerIndex?: number) => {
    const state = get();
    const { currentPair, players, selectedCategories, mrWhiteCannotStart } = state;
    const { finalUC, finalMW } = computeFinalCounts(state);
    // Add current pair to disabled list
    if (currentPair) {
      const disabled = loadDisabledPairs();
      if (!disabled.includes(currentPair.id)) {
        disabled.push(currentPair.id);
        saveDisabledPairs(disabled);
      }
    }
    // Restart with same players but a new pair
    // If firstPlayerIndex is set, rotate the player order so that player sees their card first
    let { names, emojis, colors } = extractPlayerProps(players);
    if (firstPlayerIndex != null && firstPlayerIndex > 0 && firstPlayerIndex < players.length) {
      const rotate = <T,>(arr: T[]) => [...arr.slice(firstPlayerIndex), ...arr.slice(0, firstPlayerIndex)];
      names = rotate(names);
      emojis = rotate(emojis);
      colors = rotate(colors);
    }
    const disabledPairs = loadDisabledPairs();
    const pair = pickPair(selectedCategories, disabledPairs);
    const newPlayers = createPlayers(names, emojis, colors, pair, finalUC, finalMW);
    const speakingOrder = buildSpeakingOrder(newPlayers, mrWhiteCannotStart);
    set({
      phase: 'reveal',
      players: newPlayers,
      currentPair: pair,
      currentPlayerIndex: 0,
      speakingOrder,
      winner: null,
      cheatLog: { peekCounts: {}, showAllCount: 0 },
    });
  },

  eliminatePlayer: (playerIndex: number) => {
    const { players } = get();
    const updated = players.map((p, i) =>
      i === playerIndex ? { ...p, eliminated: true } : p,
    );
    const winner = checkGameOver(updated);
    if (winner) {
      set({ players: updated, winner, phase: 'result' });
    } else {
      set({ players: updated });
    }
  },

  updateCheatLog: (log) => set({ cheatLog: log }),
}));
