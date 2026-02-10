import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPlayerProfiles,
  savePlayerProfiles,
  clearPlayerProfiles,
  loadUndercoverCount,
  saveUndercoverCount,
  loadMrWhiteCount,
  saveMrWhiteCount,
  loadDisabledPairs,
  saveDisabledPairs,
  loadEasyMode,
  saveEasyMode,
  loadRoster,
  saveRoster,
  loadGroups,
  saveGroups,
  type PlayerProfile,
} from './storage';
import type { RosterPlayer, PlayerGroup } from '../types/game';

const STORAGE_KEY = 'undercover-kids-players';

beforeEach(() => {
  localStorage.clear();
});

describe('loadPlayerProfiles', () => {
  it('returns empty array when nothing saved', () => {
    expect(loadPlayerProfiles()).toEqual([]);
  });

  it('returns saved profiles after savePlayerProfiles', () => {
    const profiles: PlayerProfile[] = [
      { name: 'Alice', avatarEmoji: '🐱', avatarColor: '#ff0000' },
      { name: 'Bob', avatarEmoji: '🐶', avatarColor: '#00ff00' },
    ];
    savePlayerProfiles(profiles);
    expect(loadPlayerProfiles()).toEqual(profiles);
  });

  it('returns empty array if localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json!!!');
    expect(loadPlayerProfiles()).toEqual([]);
  });
});

describe('savePlayerProfiles', () => {
  it('saves profiles that can be loaded back', () => {
    const profiles: PlayerProfile[] = [
      { name: 'Charlie', avatarEmoji: '🦊', avatarColor: '#0000ff' },
    ];
    savePlayerProfiles(profiles);
    expect(loadPlayerProfiles()).toEqual(profiles);
  });

  it('overwrites previous profiles', () => {
    const first: PlayerProfile[] = [
      { name: 'Alice', avatarEmoji: '🐱', avatarColor: '#ff0000' },
    ];
    const second: PlayerProfile[] = [
      { name: 'Bob', avatarEmoji: '🐶', avatarColor: '#00ff00' },
    ];
    savePlayerProfiles(first);
    savePlayerProfiles(second);
    expect(loadPlayerProfiles()).toEqual(second);
  });
});

describe('clearPlayerProfiles', () => {
  it('clears saved profiles', () => {
    const profiles: PlayerProfile[] = [
      { name: 'Alice', avatarEmoji: '🐱', avatarColor: '#ff0000' },
    ];
    savePlayerProfiles(profiles);
    clearPlayerProfiles();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('loadPlayerProfiles returns empty array after clear', () => {
    const profiles: PlayerProfile[] = [
      { name: 'Alice', avatarEmoji: '🐱', avatarColor: '#ff0000' },
    ];
    savePlayerProfiles(profiles);
    clearPlayerProfiles();
    expect(loadPlayerProfiles()).toEqual([]);
  });
});

// ── Undercover Count ────────────────────────────────────────

const UNDERCOVER_COUNT_KEY = 'undercover-kids-undercover-count';

describe('loadUndercoverCount', () => {
  it('returns 1 when nothing saved (default)', () => {
    expect(loadUndercoverCount()).toBe(1);
  });

  it('returns saved value after saveUndercoverCount', () => {
    saveUndercoverCount(3);
    expect(loadUndercoverCount()).toBe(3);
  });

  it('returns saved value of 0', () => {
    saveUndercoverCount(0);
    expect(loadUndercoverCount()).toBe(0);
  });

  it('returns 1 if localStorage contains invalid JSON', () => {
    localStorage.setItem(UNDERCOVER_COUNT_KEY, '{not valid}');
    expect(loadUndercoverCount()).toBe(1);
  });
});

describe('saveUndercoverCount', () => {
  it('persists to localStorage', () => {
    saveUndercoverCount(2);
    expect(localStorage.getItem(UNDERCOVER_COUNT_KEY)).toBe('2');
  });

  it('overwrites previous value', () => {
    saveUndercoverCount(1);
    saveUndercoverCount(4);
    expect(localStorage.getItem(UNDERCOVER_COUNT_KEY)).toBe('4');
  });
});

// ── Mr. White Count ─────────────────────────────────────────

const MRWHITE_COUNT_KEY = 'undercover-kids-mrwhite-count';

describe('loadMrWhiteCount', () => {
  it('returns 0 when nothing saved (default)', () => {
    expect(loadMrWhiteCount()).toBe(0);
  });

  it('returns saved value after saveMrWhiteCount', () => {
    saveMrWhiteCount(2);
    expect(loadMrWhiteCount()).toBe(2);
  });

  it('returns 0 if localStorage contains invalid JSON', () => {
    localStorage.setItem(MRWHITE_COUNT_KEY, '{not valid}');
    expect(loadMrWhiteCount()).toBe(0);
  });
});

describe('saveMrWhiteCount', () => {
  it('persists to localStorage', () => {
    saveMrWhiteCount(1);
    expect(localStorage.getItem(MRWHITE_COUNT_KEY)).toBe('1');
  });

  it('overwrites previous value', () => {
    saveMrWhiteCount(1);
    saveMrWhiteCount(3);
    expect(localStorage.getItem(MRWHITE_COUNT_KEY)).toBe('3');
  });
});

// ── Disabled Pairs ──────────────────────────────────────────

const DISABLED_PAIRS_KEY = 'undercover-kids-disabled-pairs';

describe('loadDisabledPairs', () => {
  it('returns empty array when nothing saved', () => {
    expect(loadDisabledPairs()).toEqual([]);
  });

  it('returns saved ids after saveDisabledPairs', () => {
    const ids = ['a1', 'f3', 'h5'];
    saveDisabledPairs(ids);
    expect(loadDisabledPairs()).toEqual(ids);
  });

  it('returns empty array if localStorage contains invalid JSON', () => {
    localStorage.setItem(DISABLED_PAIRS_KEY, 'not json');
    expect(loadDisabledPairs()).toEqual([]);
  });
});

describe('saveDisabledPairs', () => {
  it('persists to localStorage', () => {
    const ids = ['a1', 'a2'];
    saveDisabledPairs(ids);
    expect(JSON.parse(localStorage.getItem(DISABLED_PAIRS_KEY)!)).toEqual(ids);
  });

  it('overwrites previous value', () => {
    saveDisabledPairs(['a1']);
    saveDisabledPairs(['b2', 'c3']);
    expect(loadDisabledPairs()).toEqual(['b2', 'c3']);
  });

  it('can save empty array', () => {
    saveDisabledPairs(['a1']);
    saveDisabledPairs([]);
    expect(loadDisabledPairs()).toEqual([]);
  });
});

const EASY_MODE_KEY = 'undercover-kids-easy-mode';

describe('loadEasyMode', () => {
  it('returns false when nothing saved (default)', () => {
    expect(loadEasyMode()).toBe(false);
  });

  it('returns saved value after saveEasyMode(true)', () => {
    saveEasyMode(true);
    expect(loadEasyMode()).toBe(true);
  });

  it('returns saved value after saveEasyMode(false)', () => {
    saveEasyMode(true);
    saveEasyMode(false);
    expect(loadEasyMode()).toBe(false);
  });

  it('returns false if localStorage contains invalid JSON', () => {
    localStorage.setItem(EASY_MODE_KEY, '{not valid}');
    expect(loadEasyMode()).toBe(false);
  });
});

describe('saveEasyMode', () => {
  it('persists to localStorage', () => {
    saveEasyMode(true);
    expect(localStorage.getItem(EASY_MODE_KEY)).toBe('true');
  });

  it('overwrites previous value', () => {
    saveEasyMode(true);
    saveEasyMode(false);
    expect(localStorage.getItem(EASY_MODE_KEY)).toBe('false');
  });
});

// ── Roster ──────────────────────────────────────────────────

const ROSTER_KEY = 'undercover-kids-roster';

describe('loadRoster', () => {
  it('returns empty array when nothing saved', () => {
    expect(loadRoster()).toEqual([]);
  });

  it('returns saved roster after saveRoster', () => {
    const roster: RosterPlayer[] = [
      { id: 'r1', name: 'Alice', avatarEmoji: '🐱', avatarColor: '#ff0000' },
      { id: 'r2', name: 'Bob', avatarEmoji: '🐶', avatarColor: '#00ff00' },
    ];
    saveRoster(roster);
    expect(loadRoster()).toEqual(roster);
  });

  it('returns empty array if localStorage contains invalid JSON', () => {
    localStorage.setItem(ROSTER_KEY, '{broken}');
    expect(loadRoster()).toEqual([]);
  });
});

describe('saveRoster', () => {
  it('persists to localStorage', () => {
    const roster: RosterPlayer[] = [
      { id: 'r1', name: 'Charlie', avatarEmoji: '🦊', avatarColor: '#0000ff' },
    ];
    saveRoster(roster);
    expect(JSON.parse(localStorage.getItem(ROSTER_KEY)!)).toEqual(roster);
  });

  it('overwrites previous roster', () => {
    const first: RosterPlayer[] = [
      { id: 'r1', name: 'Alice', avatarEmoji: '🐱', avatarColor: '#ff0000' },
    ];
    const second: RosterPlayer[] = [
      { id: 'r2', name: 'Bob', avatarEmoji: '🐶', avatarColor: '#00ff00' },
    ];
    saveRoster(first);
    saveRoster(second);
    expect(loadRoster()).toEqual(second);
  });

  it('can save empty roster', () => {
    saveRoster([{ id: 'r1', name: 'X', avatarEmoji: '🐱', avatarColor: '#ff0000' }]);
    saveRoster([]);
    expect(loadRoster()).toEqual([]);
  });
});

// ── Groups ──────────────────────────────────────────────────

const GROUPS_KEY = 'undercover-kids-groups';

describe('loadGroups', () => {
  it('returns empty array when nothing saved', () => {
    expect(loadGroups()).toEqual([]);
  });

  it('returns saved groups after saveGroups', () => {
    const groups: PlayerGroup[] = [
      { id: 'g1', name: 'Famille', playerIds: ['r1', 'r2', 'r3'] },
    ];
    saveGroups(groups);
    expect(loadGroups()).toEqual(groups);
  });

  it('returns empty array if localStorage contains invalid JSON', () => {
    localStorage.setItem(GROUPS_KEY, 'nope');
    expect(loadGroups()).toEqual([]);
  });
});

describe('saveGroups', () => {
  it('persists to localStorage', () => {
    const groups: PlayerGroup[] = [
      { id: 'g1', name: 'Copains', playerIds: ['r1', 'r2', 'r3', 'r4'] },
    ];
    saveGroups(groups);
    expect(JSON.parse(localStorage.getItem(GROUPS_KEY)!)).toEqual(groups);
  });

  it('overwrites previous groups', () => {
    const first: PlayerGroup[] = [
      { id: 'g1', name: 'A', playerIds: ['r1', 'r2', 'r3'] },
    ];
    const second: PlayerGroup[] = [
      { id: 'g2', name: 'B', playerIds: ['r4', 'r5', 'r6'] },
    ];
    saveGroups(first);
    saveGroups(second);
    expect(loadGroups()).toEqual(second);
  });

  it('can save empty groups', () => {
    saveGroups([{ id: 'g1', name: 'X', playerIds: ['r1', 'r2', 'r3'] }]);
    saveGroups([]);
    expect(loadGroups()).toEqual([]);
  });

  it('handles groups with many playerIds', () => {
    const groups: PlayerGroup[] = [
      { id: 'g1', name: 'Big', playerIds: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'] },
    ];
    saveGroups(groups);
    expect(loadGroups()).toEqual(groups);
  });
});
