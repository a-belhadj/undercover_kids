export interface PlayerProfile {
  name: string;
  avatarEmoji: string;
  avatarColor: string;
}

const STORAGE_KEY = 'undercover-kids-players';
const UNDERCOVER_COUNT_KEY = 'undercover-kids-undercover-count';
const MRWHITE_COUNT_KEY = 'undercover-kids-mrwhite-count';
const DISABLED_PAIRS_KEY = 'undercover-kids-disabled-pairs';
const EASY_MODE_KEY = 'undercover-kids-easy-mode';
const ROSTER_KEY = 'undercover-kids-roster';
const GROUPS_KEY = 'undercover-kids-groups';
const SELECTED_CATEGORIES_KEY = 'undercover-kids-selected-categories';
const MRWHITE_CANNOT_START_KEY = 'undercover-kids-mrwhite-cannot-start';
const INTRUS_COUNT_KEY = 'undercover-kids-intrus-count';
const UNDERCOVER_ENABLED_KEY = 'undercover-kids-undercover-enabled';
const MRWHITE_ENABLED_KEY = 'undercover-kids-mrwhite-enabled';
const RANDOM_SPLIT_KEY = 'undercover-kids-random-split';
const PAIR_DISPLAY_MODE_KEY = 'undercover-kids-pair-display-mode';
const ANTI_CHEAT_KEY = 'undercover-kids-anti-cheat';

import type { RosterPlayer, PlayerGroup, PairDisplayMode } from '../types/game';

// ── Internal helpers ─────────────────────────────────────────

function loadItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function saveItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded, etc.)
  }
}

// ── Player profiles ──────────────────────────────────────────

export function loadPlayerProfiles(): PlayerProfile[] { return loadItem(STORAGE_KEY, []); }
export function savePlayerProfiles(profiles: PlayerProfile[]): void { saveItem(STORAGE_KEY, profiles); }

export function clearPlayerProfiles(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

// ── Undercover count ─────────────────────────────────────────

export function loadUndercoverCount(): number { return loadItem(UNDERCOVER_COUNT_KEY, 1); }
export function saveUndercoverCount(count: number): void { saveItem(UNDERCOVER_COUNT_KEY, count); }

// ── Mr. White count ──────────────────────────────────────────

export function loadMrWhiteCount(): number { return loadItem(MRWHITE_COUNT_KEY, 0); }
export function saveMrWhiteCount(count: number): void { saveItem(MRWHITE_COUNT_KEY, count); }

// ── Disabled pairs ───────────────────────────────────────────

export function loadDisabledPairs(): string[] { return loadItem(DISABLED_PAIRS_KEY, []); }
export function saveDisabledPairs(ids: string[]): void { saveItem(DISABLED_PAIRS_KEY, ids); }

// ── Easy mode ────────────────────────────────────────────────

export function loadEasyMode(): boolean { return loadItem(EASY_MODE_KEY, false); }
export function saveEasyMode(enabled: boolean): void { saveItem(EASY_MODE_KEY, enabled); }

// ── Roster (persistent player list) ─────────────────────────

export function loadRoster(): RosterPlayer[] { return loadItem(ROSTER_KEY, []); }
export function saveRoster(roster: RosterPlayer[]): void { saveItem(ROSTER_KEY, roster); }

// ── Groups (named sets of roster player ids) ────────────────

export function loadGroups(): PlayerGroup[] { return loadItem(GROUPS_KEY, []); }
export function saveGroups(groups: PlayerGroup[]): void { saveItem(GROUPS_KEY, groups); }

// ── Selected categories ──────────────────────────────────────

export function loadSelectedCategories(): string[] { return loadItem(SELECTED_CATEGORIES_KEY, []); }
export function saveSelectedCategories(categories: string[]): void { saveItem(SELECTED_CATEGORIES_KEY, categories); }

// ── Mr. White cannot start setting ───────────────────────────

export function loadMrWhiteCannotStart(): boolean { return loadItem(MRWHITE_CANNOT_START_KEY, true); }
export function saveMrWhiteCannotStart(enabled: boolean): void { saveItem(MRWHITE_CANNOT_START_KEY, enabled); }

// ── Intrus config ────────────────────────────────────────────

export function loadIntrusCount(): number { return loadItem(INTRUS_COUNT_KEY, 1); }
export function saveIntrusCount(count: number): void { saveItem(INTRUS_COUNT_KEY, count); }

export function loadUndercoverEnabled(): boolean { return loadItem(UNDERCOVER_ENABLED_KEY, true); }
export function saveUndercoverEnabled(enabled: boolean): void { saveItem(UNDERCOVER_ENABLED_KEY, enabled); }

export function loadMrWhiteEnabled(): boolean { return loadItem(MRWHITE_ENABLED_KEY, false); }
export function saveMrWhiteEnabled(enabled: boolean): void { saveItem(MRWHITE_ENABLED_KEY, enabled); }

export function loadRandomSplit(): boolean { return loadItem(RANDOM_SPLIT_KEY, false); }
export function saveRandomSplit(enabled: boolean): void { saveItem(RANDOM_SPLIT_KEY, enabled); }

// ── Pair display mode ────────────────────────────────────────

export function loadPairDisplayMode(): PairDisplayMode {
  const val = loadItem<string>(PAIR_DISPLAY_MODE_KEY, 'both');
  if (val === 'icon' || val === 'text' || val === 'both') return val;
  return 'both';
}

export function savePairDisplayMode(mode: PairDisplayMode): void { saveItem(PAIR_DISPLAY_MODE_KEY, mode); }

// ── Anti-cheat settings ──────────────────────────────────────

export interface AntiCheatSettings {
  allowPeek: boolean;
  peekAlarm: boolean;
  allowShowAll: boolean;
  showAllAlarm: boolean;
}

const ANTI_CHEAT_DEFAULTS: AntiCheatSettings = {
  allowPeek: true,
  peekAlarm: true,
  allowShowAll: true,
  showAllAlarm: true,
};

export function loadAntiCheat(): AntiCheatSettings {
  try {
    const raw = localStorage.getItem(ANTI_CHEAT_KEY);
    if (!raw) return { ...ANTI_CHEAT_DEFAULTS };
    return { ...ANTI_CHEAT_DEFAULTS, ...(JSON.parse(raw) as Partial<AntiCheatSettings>) };
  } catch {
    return { ...ANTI_CHEAT_DEFAULTS };
  }
}

export function saveAntiCheat(settings: AntiCheatSettings): void { saveItem(ANTI_CHEAT_KEY, settings); }
