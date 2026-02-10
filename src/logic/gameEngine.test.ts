import { describe, it, expect } from 'vitest';
import { pickPair, createPlayers } from './gameEngine';
import { emojiPairs } from '../data/emojiPairs';
import type { EmojiPair } from '../types/game';

describe('pickPair', () => {
  it('returns a valid EmojiPair with id, category, civil, and undercover', () => {
    const pair = pickPair([]);
    expect(pair).toHaveProperty('id');
    expect(pair).toHaveProperty('category');
    expect(pair).toHaveProperty('civil');
    expect(pair).toHaveProperty('undercover');
    expect(typeof pair.id).toBe('string');
    expect(typeof pair.category).toBe('string');
    expect(typeof pair.civil).toBe('string');
    expect(typeof pair.undercover).toBe('string');
  });

  it('returns a pair that exists in the emojiPairs dataset', () => {
    const pair = pickPair([]);
    expect(emojiPairs).toContainEqual(pair);
  });

  it('when categories is empty, can return any category', () => {
    const categories = new Set<string>();
    for (let i = 0; i < 200; i++) {
      categories.add(pickPair([]).category);
    }
    // With 200 draws from 12 categories, we should see at least 2
    expect(categories.size).toBeGreaterThanOrEqual(2);
  });

  it('when a single category is given, always returns that category', () => {
    for (let i = 0; i < 50; i++) {
      const pair = pickPair(['animals']);
      expect(pair.category).toBe('animals');
    }
  });

  it('when multiple categories are given, only returns pairs from those categories', () => {
    const allowed = new Set(['animals', 'food']);
    for (let i = 0; i < 100; i++) {
      const pair = pickPair(['animals', 'food']);
      expect(allowed.has(pair.category)).toBe(true);
    }
  });

  it('when multiple categories are given, can return from any of them', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(pickPair(['animals', 'food']).category);
    }
    expect(seen.has('animals')).toBe(true);
    expect(seen.has('food')).toBe(true);
  });

  it('when category is "animals", always returns an animals pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['animals']).category).toBe('animals');
    }
  });

  it('when category is "food", always returns a food pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['food']).category).toBe('food');
    }
  });

  it('when category is "fruits", always returns a fruits pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['fruits']).category).toBe('fruits');
    }
  });

  it('when category is "vehicles", always returns a vehicles pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['vehicles']).category).toBe('vehicles');
    }
  });

  it('when category is "nature", always returns a nature pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['nature']).category).toBe('nature');
    }
  });

  it('when category is "objects", always returns an objects pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['objects']).category).toBe('objects');
    }
  });

  it('when category is "heroes", always returns a heroes pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['heroes']).category).toBe('heroes');
    }
  });

  it('when category is "clothes", always returns a clothes pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['clothes']).category).toBe('clothes');
    }
  });

  it('when category is "music", always returns a music pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['music']).category).toBe('music');
    }
  });

  it('when category is "house", always returns a house pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['house']).category).toBe('house');
    }
  });

  it('when category is "emotions", always returns an emotions pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['emotions']).category).toBe('emotions');
    }
  });

  it('when category is "body", always returns a body pair', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickPair(['body']).category).toBe('body');
    }
  });
});

describe('createPlayers', () => {
  const pair: EmojiPair = {
    id: 'test1',
    category: 'animals',
    civil: '🐱',
    undercover: '🐯',
    civilLabel: 'Chat',
    undercoverLabel: 'Tigre',
  };

  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
  const avatarEmojis = ['🐶', '🐱', '🐸', '🐰', '🦊'];
  const avatarColors = ['#E17055', '#00B894', '#6C5CE7', '#FD79A8', '#FDCB6E'];

  describe('basic structure', () => {
    it('returns the correct number of players', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      expect(players).toHaveLength(5);
    });

    it('each player has a unique id', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      const ids = players.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(players.length);
    });

    it('each player id is a non-empty string', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      for (const player of players) {
        expect(typeof player.id).toBe('string');
        expect(player.id.length).toBeGreaterThan(0);
      }
    });

    it('player names match input in order', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      expect(players.map((p) => p.name)).toEqual(names);
    });

    it('player avatarEmojis match input in order', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      expect(players.map((p) => p.avatarEmoji)).toEqual(avatarEmojis);
    });

    it('player avatarColors match input in order', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      expect(players.map((p) => p.avatarColor)).toEqual(avatarColors);
    });
  });

  describe('emoji assignment', () => {
    it('civil players get pair.civil emoji', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      const civils = players.filter((p) => p.role === 'civil');
      for (const player of civils) {
        expect(player.emoji).toBe(pair.civil);
      }
    });

    it('undercover players get pair.undercover emoji', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      const undercovers = players.filter((p) => p.role === 'undercover');
      for (const player of undercovers) {
        expect(player.emoji).toBe(pair.undercover);
      }
    });

    it('Mr. White players get null emoji', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 1);
      const mrWhites = players.filter((p) => p.role === 'mrwhite');
      for (const player of mrWhites) {
        expect(player.emoji).toBeNull();
      }
    });
  });

  describe('role distribution with undercover only (no Mr. White)', () => {
    it('5 players, 1 uc, 0 mw: 4 civil, 1 undercover, 0 mrwhite', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 0);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(4);
      expect(roleCounts.undercover).toBe(1);
      expect(roleCounts.mrwhite).toBe(0);
    });

    it('3 players, 1 uc, 0 mw: 2 civil, 1 undercover, 0 mrwhite', () => {
      const n = names.slice(0, 3);
      const ae = avatarEmojis.slice(0, 3);
      const ac = avatarColors.slice(0, 3);
      const players = createPlayers(n, ae, ac, pair, 1, 0);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(2);
      expect(roleCounts.undercover).toBe(1);
      expect(roleCounts.mrwhite).toBe(0);
    });

    it('4 players, 1 uc, 0 mw: 3 civil, 1 undercover, 0 mrwhite', () => {
      const n = names.slice(0, 4);
      const ae = avatarEmojis.slice(0, 4);
      const ac = avatarColors.slice(0, 4);
      const players = createPlayers(n, ae, ac, pair, 1, 0);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(3);
      expect(roleCounts.undercover).toBe(1);
      expect(roleCounts.mrwhite).toBe(0);
    });

    it('6 players, 1 uc, 0 mw: 5 civil, 1 undercover, 0 mrwhite', () => {
      const n = [...names, 'Frank'];
      const ae = [...avatarEmojis, '🦁'];
      const ac = [...avatarColors, '#00CEC9'];
      const players = createPlayers(n, ae, ac, pair, 1, 0);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(5);
      expect(roleCounts.undercover).toBe(1);
      expect(roleCounts.mrwhite).toBe(0);
    });

    it('7 players, 2 uc, 0 mw: 5 civil, 2 undercover, 0 mrwhite', () => {
      const n = [...names, 'Frank', 'Grace'];
      const ae = [...avatarEmojis, '🦁', '🐼'];
      const ac = [...avatarColors, '#00CEC9', '#E84393'];
      const players = createPlayers(n, ae, ac, pair, 2, 0);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(5);
      expect(roleCounts.undercover).toBe(2);
      expect(roleCounts.mrwhite).toBe(0);
    });

    it('8 players, 2 uc, 0 mw: 6 civil, 2 undercover, 0 mrwhite', () => {
      const n = [...names, 'Frank', 'Grace', 'Henry'];
      const ae = [...avatarEmojis, '🦁', '🐼', '🐧'];
      const ac = [...avatarColors, '#00CEC9', '#E84393', '#55A3E7'];
      const players = createPlayers(n, ae, ac, pair, 2, 0);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(6);
      expect(roleCounts.undercover).toBe(2);
      expect(roleCounts.mrwhite).toBe(0);
    });
  });

  describe('role distribution with undercover + Mr. White', () => {
    it('5 players, 1 uc, 1 mw: 3 civil, 1 undercover, 1 mrwhite', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 1);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(3);
      expect(roleCounts.undercover).toBe(1);
      expect(roleCounts.mrwhite).toBe(1);
    });

    it('4 players, 1 uc, 1 mw: 2 civil, 1 undercover, 1 mrwhite', () => {
      const n = names.slice(0, 4);
      const ae = avatarEmojis.slice(0, 4);
      const ac = avatarColors.slice(0, 4);
      const players = createPlayers(n, ae, ac, pair, 1, 1);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(2);
      expect(roleCounts.undercover).toBe(1);
      expect(roleCounts.mrwhite).toBe(1);
    });

    it('6 players, 1 uc, 1 mw: 4 civil, 1 undercover, 1 mrwhite', () => {
      const n = [...names, 'Frank'];
      const ae = [...avatarEmojis, '🦁'];
      const ac = [...avatarColors, '#00CEC9'];
      const players = createPlayers(n, ae, ac, pair, 1, 1);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(4);
      expect(roleCounts.undercover).toBe(1);
      expect(roleCounts.mrwhite).toBe(1);
    });

    it('8 players, 2 uc, 2 mw: 4 civil, 2 undercover, 2 mrwhite', () => {
      const n = [...names, 'Frank', 'Grace', 'Henry'];
      const ae = [...avatarEmojis, '🦁', '🐼', '🐧'];
      const ac = [...avatarColors, '#00CEC9', '#E84393', '#55A3E7'];
      const players = createPlayers(n, ae, ac, pair, 2, 2);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(4);
      expect(roleCounts.undercover).toBe(2);
      expect(roleCounts.mrwhite).toBe(2);
    });
  });

  describe('role distribution with Mr. White only (no undercover)', () => {
    it('4 players, 0 uc, 1 mw: 3 civil, 0 undercover, 1 mrwhite', () => {
      const n = names.slice(0, 4);
      const ae = avatarEmojis.slice(0, 4);
      const ac = avatarColors.slice(0, 4);
      const players = createPlayers(n, ae, ac, pair, 0, 1);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil).toBe(3);
      expect(roleCounts.undercover).toBe(0);
      expect(roleCounts.mrwhite).toBe(1);
    });
  });

  describe('every player has a valid role', () => {
    it('all roles are one of civil, undercover, or mrwhite', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 1);
      const validRoles = ['civil', 'undercover', 'mrwhite'];
      for (const player of players) {
        expect(validRoles).toContain(player.role);
      }
    });
  });

  describe('total role count equals player count', () => {
    it('sum of all roles equals number of players', () => {
      const players = createPlayers(names, avatarEmojis, avatarColors, pair, 1, 1);
      const roleCounts = countRoles(players);
      expect(roleCounts.civil + roleCounts.undercover + roleCounts.mrwhite).toBe(names.length);
    });
  });
});

function countRoles(players: { role: string }[]) {
  return {
    civil: players.filter((p) => p.role === 'civil').length,
    undercover: players.filter((p) => p.role === 'undercover').length,
    mrwhite: players.filter((p) => p.role === 'mrwhite').length,
  };
}
