import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './gameStore';
import type { EmojiPair } from '../types/game';

vi.mock('../lib/storage', () => ({
  savePlayerProfiles: vi.fn(),
  loadPlayerProfiles: vi.fn(() => []),
  clearPlayerProfiles: vi.fn(),
  loadUndercoverCount: vi.fn(() => 1),
  saveUndercoverCount: vi.fn(),
  loadMrWhiteCount: vi.fn(() => 0),
  saveMrWhiteCount: vi.fn(),
  loadDisabledPairs: vi.fn(() => []),
  saveDisabledPairs: vi.fn(),
  loadEasyMode: vi.fn(() => false),
  saveEasyMode: vi.fn(),
  loadSelectedCategories: vi.fn(() => []),
  saveSelectedCategories: vi.fn(),
  loadMrWhiteCannotStart: vi.fn(() => true),
  saveMrWhiteCannotStart: vi.fn(),
  loadAntiCheat: vi.fn(() => ({ allowPeek: true, peekAlarm: true, allowShowAll: true, showAllAlarm: true })),
  saveAntiCheat: vi.fn(),
}));

const initialState = {
  phase: 'home' as const,
  players: [],
  currentPair: null,
  currentPlayerIndex: 0,
  speakingOrder: [],
  undercoverCount: 1,
  mrWhiteCount: 0,
  easyMode: false,
  selectedCategories: [],
  mrWhiteCannotStart: true,
};

const fakePair: EmojiPair = {
  id: 'test-pair',
  category: 'animals',
  civil: '🐶',
  undercover: '🐱',
  civilLabel: 'Chien',
  undercoverLabel: 'Chat',
};

const fakePair2: EmojiPair = {
  id: 'test-pair-2',
  category: 'food',
  civil: '🍕',
  undercover: '🍔',
  civilLabel: 'Pizza',
  undercoverLabel: 'Hamburger',
};

let pickPairCallCount = 0;

vi.mock('../logic/gameEngine', () => ({
  pickPair: vi.fn(() => {
    pickPairCallCount++;
    // Alternate between pairs so tests can detect a new pair was picked.
    return pickPairCallCount % 2 === 1 ? fakePair : fakePair2;
  }),
  createPlayers: vi.fn(
    (
      names: string[],
      avatarEmojis: string[],
      avatarColors: string[],
      pair: EmojiPair,
    ) =>
      names.map((name, i) => ({
        id: `player-${i}`,
        name,
        role: i === 0 ? 'undercover' : 'civil',
        emoji: i === 0 ? pair.undercover : pair.civil,
        emojiLabel: i === 0 ? pair.undercoverLabel : pair.civilLabel,
        avatarEmoji: avatarEmojis[i],
        avatarColor: avatarColors[i],
      })),
  ),
  buildSpeakingOrder: vi.fn(
    (players: { id: string }[]) => players.map((_, i) => i),
  ),
}));

const testNames = ['Alice', 'Bob', 'Charlie'];
const testEmojis = ['🐶', '🐱', '🐸'];
const testColors = ['#E17055', '#00B894', '#6C5CE7'];

beforeEach(() => {
  vi.clearAllMocks();
  pickPairCallCount = 0;
  useGameStore.setState({ ...initialState });
});

describe('gameStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useGameStore.getState();
      expect(state.phase).toBe('home');
      expect(state.players).toEqual([]);
      expect(state.currentPair).toBeNull();
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.undercoverCount).toBe(1);
      expect(state.mrWhiteCount).toBe(0);
      expect(state.easyMode).toBe(false);
      expect(state.selectedCategories).toEqual([]);
      expect(state.mrWhiteCannotStart).toBe(true);
    });
  });

  describe('setPhase', () => {
    it('updates the phase', () => {
      useGameStore.getState().setPhase('setup');
      expect(useGameStore.getState().phase).toBe('setup');
    });

    it('can set any valid phase', () => {
      const phases = ['home', 'setup', 'reveal', 'discussion'] as const;
      for (const phase of phases) {
        useGameStore.getState().setPhase(phase);
        expect(useGameStore.getState().phase).toBe(phase);
      }
    });
  });

  describe('goHome', () => {
    it('resets everything to initial state but preserves undercoverCount, mrWhiteCount, easyMode, selectedCategories and mrWhiteCannotStart', () => {
      // Mutate state first
      useGameStore.setState({
        phase: 'discussion',
        players: [
          { id: '1', name: 'X', role: 'civil', emoji: '🐶', emojiLabel: 'Chien', avatarEmoji: '🐶', avatarColor: '#E17055' },
        ],
        currentPair: fakePair,
        currentPlayerIndex: 3,
        undercoverCount: 2,
        mrWhiteCount: 1,
        easyMode: true,
        selectedCategories: ['animals'],
        mrWhiteCannotStart: false,
      });

      useGameStore.getState().goHome();

      const state = useGameStore.getState();
      expect(state.phase).toBe('home');
      expect(state.players).toEqual([]);
      expect(state.currentPair).toBeNull();
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.undercoverCount).toBe(2);
      expect(state.mrWhiteCount).toBe(1);
      expect(state.easyMode).toBe(true);
      expect(state.selectedCategories).toEqual(['animals']);
      expect(state.mrWhiteCannotStart).toBe(false);
    });
  });

  describe('setUndercoverCount', () => {
    it('sets undercoverCount to 2', () => {
      useGameStore.getState().setUndercoverCount(2);
      expect(useGameStore.getState().undercoverCount).toBe(2);
    });

    it('sets undercoverCount to 0', () => {
      useGameStore.getState().setUndercoverCount(0);
      expect(useGameStore.getState().undercoverCount).toBe(0);
    });

    it('persists to storage', async () => {
      const { saveUndercoverCount } = await import('../lib/storage');
      useGameStore.getState().setUndercoverCount(3);
      expect(saveUndercoverCount).toHaveBeenCalledWith(3);
    });
  });

  describe('setMrWhiteCount', () => {
    it('sets mrWhiteCount to 1', () => {
      useGameStore.getState().setMrWhiteCount(1);
      expect(useGameStore.getState().mrWhiteCount).toBe(1);
    });

    it('sets mrWhiteCount to 0', () => {
      useGameStore.getState().setMrWhiteCount(1);
      useGameStore.getState().setMrWhiteCount(0);
      expect(useGameStore.getState().mrWhiteCount).toBe(0);
    });

    it('persists to storage', async () => {
      const { saveMrWhiteCount } = await import('../lib/storage');
      useGameStore.getState().setMrWhiteCount(2);
      expect(saveMrWhiteCount).toHaveBeenCalledWith(2);
    });
  });

  describe('setEasyMode', () => {
    it('sets easyMode to true', () => {
      useGameStore.getState().setEasyMode(true);
      expect(useGameStore.getState().easyMode).toBe(true);
    });

    it('sets easyMode to false', () => {
      useGameStore.getState().setEasyMode(true);
      useGameStore.getState().setEasyMode(false);
      expect(useGameStore.getState().easyMode).toBe(false);
    });

    it('persists easyMode to storage', async () => {
      const { saveEasyMode } = await import('../lib/storage');
      useGameStore.getState().setEasyMode(true);
      expect(saveEasyMode).toHaveBeenCalledWith(true);
    });
  });

  describe('setMrWhiteCannotStart', () => {
    it('sets mrWhiteCannotStart to false', () => {
      useGameStore.getState().setMrWhiteCannotStart(false);
      expect(useGameStore.getState().mrWhiteCannotStart).toBe(false);
    });

    it('sets mrWhiteCannotStart to true', () => {
      useGameStore.getState().setMrWhiteCannotStart(false);
      useGameStore.getState().setMrWhiteCannotStart(true);
      expect(useGameStore.getState().mrWhiteCannotStart).toBe(true);
    });

    it('persists to storage', async () => {
      const { saveMrWhiteCannotStart } = await import('../lib/storage');
      useGameStore.getState().setMrWhiteCannotStart(false);
      expect(saveMrWhiteCannotStart).toHaveBeenCalledWith(false);
    });
  });

  describe('setSelectedCategory', () => {
    it('sets a single category', () => {
      useGameStore.getState().setSelectedCategory('animals');
      expect(useGameStore.getState().selectedCategories).toEqual(['animals']);
    });

    it('clears categories when set to null', () => {
      useGameStore.getState().setSelectedCategory('animals');
      useGameStore.getState().setSelectedCategory(null);
      expect(useGameStore.getState().selectedCategories).toEqual([]);
    });

    it('persists to storage', async () => {
      const { saveSelectedCategories } = await import('../lib/storage');
      useGameStore.getState().setSelectedCategory('animals');
      expect(saveSelectedCategories).toHaveBeenCalledWith(['animals']);
    });

    it('persists empty array when set to null', async () => {
      const { saveSelectedCategories } = await import('../lib/storage');
      useGameStore.getState().setSelectedCategory(null);
      expect(saveSelectedCategories).toHaveBeenCalledWith([]);
    });
  });

  describe('toggleCategory', () => {
    it('adds a category when not present', () => {
      useGameStore.getState().toggleCategory('animals');
      expect(useGameStore.getState().selectedCategories).toEqual(['animals']);
    });

    it('removes a category when already present', () => {
      useGameStore.getState().toggleCategory('animals');
      useGameStore.getState().toggleCategory('animals');
      expect(useGameStore.getState().selectedCategories).toEqual([]);
    });

    it('supports multiple categories', () => {
      useGameStore.getState().toggleCategory('animals');
      useGameStore.getState().toggleCategory('food');
      expect(useGameStore.getState().selectedCategories).toEqual(['animals', 'food']);
    });

    it('removes only the toggled category', () => {
      useGameStore.getState().toggleCategory('animals');
      useGameStore.getState().toggleCategory('food');
      useGameStore.getState().toggleCategory('animals');
      expect(useGameStore.getState().selectedCategories).toEqual(['food']);
    });

    it('persists to storage when adding', async () => {
      const { saveSelectedCategories } = await import('../lib/storage');
      useGameStore.getState().toggleCategory('animals');
      expect(saveSelectedCategories).toHaveBeenCalledWith(['animals']);
    });

    it('persists to storage when removing', async () => {
      const { saveSelectedCategories } = await import('../lib/storage');
      useGameStore.getState().toggleCategory('animals');
      vi.mocked(saveSelectedCategories).mockClear();
      useGameStore.getState().toggleCategory('animals');
      expect(saveSelectedCategories).toHaveBeenCalledWith([]);
    });
  });

  describe('startGame', () => {
    it('sets phase to reveal', () => {
      useGameStore.getState().startGame(testNames, testEmojis, testColors);
      expect(useGameStore.getState().phase).toBe('reveal');
    });

    it('creates the correct number of players', () => {
      useGameStore.getState().startGame(testNames, testEmojis, testColors);
      expect(useGameStore.getState().players).toHaveLength(3);
    });

    it('sets currentPair', () => {
      useGameStore.getState().startGame(testNames, testEmojis, testColors);
      expect(useGameStore.getState().currentPair).not.toBeNull();
    });

    it('resets currentPlayerIndex to 0', () => {
      useGameStore.setState({ currentPlayerIndex: 5 });
      useGameStore.getState().startGame(testNames, testEmojis, testColors);
      expect(useGameStore.getState().currentPlayerIndex).toBe(0);
    });

    it('passes undercoverCount, mrWhiteCount and selectedCategories to game engine', async () => {
      const { pickPair, createPlayers } = await import('../logic/gameEngine');

      useGameStore.setState({ undercoverCount: 2, mrWhiteCount: 1, selectedCategories: ['food'] });
      useGameStore.getState().startGame(testNames, testEmojis, testColors);

      expect(pickPair).toHaveBeenCalledWith(['food'], []);
      expect(createPlayers).toHaveBeenCalledWith(
        testNames,
        testEmojis,
        testColors,
        expect.any(Object),
        2,
        1,
      );
    });

    it('assigns player names correctly', () => {
      useGameStore.getState().startGame(testNames, testEmojis, testColors);
      const names = useGameStore.getState().players.map((p) => p.name);
      expect(names).toEqual(testNames);
    });
  });

  describe('nextReveal', () => {
    beforeEach(() => {
      useGameStore.getState().startGame(testNames, testEmojis, testColors);
    });

    it('increments currentPlayerIndex', () => {
      expect(useGameStore.getState().currentPlayerIndex).toBe(0);
      useGameStore.getState().nextReveal();
      expect(useGameStore.getState().currentPlayerIndex).toBe(1);
    });

    it('increments again on successive calls', () => {
      useGameStore.getState().nextReveal();
      useGameStore.getState().nextReveal();
      expect(useGameStore.getState().currentPlayerIndex).toBe(2);
    });

    it('transitions to discussion phase when reaching last player', () => {
      // 3 players: indices 0, 1, 2 — after 3 calls we've passed the last
      useGameStore.getState().nextReveal(); // index -> 1
      useGameStore.getState().nextReveal(); // index -> 2
      useGameStore.getState().nextReveal(); // index >= length -> discussion

      const state = useGameStore.getState();
      expect(state.phase).toBe('discussion');
      expect(state.currentPlayerIndex).toBe(0);
    });

    it('does not transition to discussion before reaching last player', () => {
      useGameStore.getState().nextReveal();
      expect(useGameStore.getState().phase).toBe('reveal');
    });
  });

  describe('restartWithSamePlayers', () => {
    beforeEach(() => {
      useGameStore.getState().startGame(testNames, testEmojis, testColors);
      // Advance state so we can verify the reset
      useGameStore.setState({ phase: 'discussion', currentPlayerIndex: 2 });
    });

    it('keeps the same player names', () => {
      useGameStore.getState().restartWithSamePlayers();
      const names = useGameStore.getState().players.map((p) => p.name);
      expect(names).toEqual(testNames);
    });

    it('sets phase to reveal', () => {
      useGameStore.getState().restartWithSamePlayers();
      expect(useGameStore.getState().phase).toBe('reveal');
    });

    it('picks a new pair', () => {
      const oldPair = useGameStore.getState().currentPair;
      useGameStore.getState().restartWithSamePlayers();
      const newPair = useGameStore.getState().currentPair;
      // The mock returns a different pair on the second call
      expect(newPair).not.toEqual(oldPair);
    });

    it('resets currentPlayerIndex to 0', () => {
      expect(useGameStore.getState().currentPlayerIndex).toBe(2);
      useGameStore.getState().restartWithSamePlayers();
      expect(useGameStore.getState().currentPlayerIndex).toBe(0);
    });

    it('preserves avatar emojis and colors', () => {
      useGameStore.getState().restartWithSamePlayers();
      const players = useGameStore.getState().players;
      expect(players.map((p) => p.avatarEmoji)).toEqual(testEmojis);
      expect(players.map((p) => p.avatarColor)).toEqual(testColors);
    });
  });

  describe('antiCheat settings', () => {
    it('has correct defaults', () => {
      const state = useGameStore.getState();
      expect(state.antiCheat).toEqual({
        allowPeek: true,
        peekAlarm: true,
        allowShowAll: true,
        showAllAlarm: true,
      });
    });

    it('setAntiCheat updates all settings', () => {
      useGameStore.getState().setAntiCheat({
        allowPeek: false,
        peekAlarm: false,
        allowShowAll: false,
        showAllAlarm: false,
      });
      expect(useGameStore.getState().antiCheat).toEqual({
        allowPeek: false,
        peekAlarm: false,
        allowShowAll: false,
        showAllAlarm: false,
      });
    });

    it('setAntiCheat updates partial settings', () => {
      useGameStore.getState().setAntiCheat({
        allowPeek: false,
        peekAlarm: true,
        allowShowAll: true,
        showAllAlarm: false,
      });
      expect(useGameStore.getState().antiCheat).toEqual({
        allowPeek: false,
        peekAlarm: true,
        allowShowAll: true,
        showAllAlarm: false,
      });
    });

    it('persists to storage', async () => {
      const { saveAntiCheat } = await import('../lib/storage');
      const newSettings = {
        allowPeek: false,
        peekAlarm: true,
        allowShowAll: false,
        showAllAlarm: true,
      };
      useGameStore.getState().setAntiCheat(newSettings);
      expect(saveAntiCheat).toHaveBeenCalledWith(newSettings);
    });

    it('is preserved after goHome', () => {
      const customSettings = {
        allowPeek: false,
        peekAlarm: false,
        allowShowAll: true,
        showAllAlarm: false,
      };
      useGameStore.getState().setAntiCheat(customSettings);

      useGameStore.setState({ phase: 'discussion', players: [
        { id: '1', name: 'X', role: 'civil', emoji: '🐶', emojiLabel: 'Chien', avatarEmoji: '🐶', avatarColor: '#E17055' },
      ] });
      useGameStore.getState().goHome();

      expect(useGameStore.getState().antiCheat).toEqual(customSettings);
    });

    it('is preserved after startGame', () => {
      const customSettings = {
        allowPeek: false,
        peekAlarm: false,
        allowShowAll: false,
        showAllAlarm: false,
      };
      useGameStore.getState().setAntiCheat(customSettings);
      useGameStore.getState().startGame(testNames, testEmojis, testColors);

      expect(useGameStore.getState().antiCheat).toEqual(customSettings);
    });

    it('is preserved after restartWithSamePlayers', () => {
      useGameStore.getState().startGame(testNames, testEmojis, testColors);
      const customSettings = {
        allowPeek: false,
        peekAlarm: true,
        allowShowAll: false,
        showAllAlarm: true,
      };
      useGameStore.getState().setAntiCheat(customSettings);
      useGameStore.getState().restartWithSamePlayers();

      expect(useGameStore.getState().antiCheat).toEqual(customSettings);
    });
  });
});
