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
const ANTI_CHEAT_KEY = 'undercover-kids-anti-cheat';

import type { RosterPlayer, PlayerGroup } from '../types/game';

/** Load saved player profiles from localStorage */
export function loadPlayerProfiles(): PlayerProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PlayerProfile[];
  } catch {
    return [];
  }
}

/** Save player profiles to localStorage */
export function savePlayerProfiles(profiles: PlayerProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded, etc.)
  }
}

/** Clear saved profiles */
export function clearPlayerProfiles(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage may be unavailable
  }
}

/** Load undercover count (default: 1) */
export function loadUndercoverCount(): number {
  try {
    const raw = localStorage.getItem(UNDERCOVER_COUNT_KEY);
    if (raw === null) return 1;
    return JSON.parse(raw) as number;
  } catch {
    return 1;
  }
}

/** Save undercover count */
export function saveUndercoverCount(count: number): void {
  try {
    localStorage.setItem(UNDERCOVER_COUNT_KEY, JSON.stringify(count));
  } catch {
    // localStorage may be unavailable
  }
}

/** Load Mr. White count (default: 0) */
export function loadMrWhiteCount(): number {
  try {
    const raw = localStorage.getItem(MRWHITE_COUNT_KEY);
    if (raw === null) return 0;
    return JSON.parse(raw) as number;
  } catch {
    return 0;
  }
}

/** Save Mr. White count */
export function saveMrWhiteCount(count: number): void {
  try {
    localStorage.setItem(MRWHITE_COUNT_KEY, JSON.stringify(count));
  } catch {
    // localStorage may be unavailable
  }
}

/** Load disabled pair ids (pairs the user deselected) */
export function loadDisabledPairs(): string[] {
  try {
    const raw = localStorage.getItem(DISABLED_PAIRS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/** Save disabled pair ids */
export function saveDisabledPairs(ids: string[]): void {
  try {
    localStorage.setItem(DISABLED_PAIRS_KEY, JSON.stringify(ids));
  } catch {
    // localStorage may be unavailable
  }
}

/** Load easy mode toggle state (default: false) */
export function loadEasyMode(): boolean {
  try {
    const raw = localStorage.getItem(EASY_MODE_KEY);
    if (raw === null) return false;
    return JSON.parse(raw) as boolean;
  } catch {
    return false;
  }
}

/** Save easy mode toggle state */
export function saveEasyMode(enabled: boolean): void {
  try {
    localStorage.setItem(EASY_MODE_KEY, JSON.stringify(enabled));
  } catch {
    // localStorage may be unavailable
  }
}

// ── Roster (persistent player list) ─────────────────────────

/** Load the player roster */
export function loadRoster(): RosterPlayer[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RosterPlayer[];
  } catch {
    return [];
  }
}

/** Save the entire roster */
export function saveRoster(roster: RosterPlayer[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  } catch {
    // localStorage may be unavailable
  }
}

// ── Groups (named sets of roster player ids) ────────────────

/** Load all player groups */
export function loadGroups(): PlayerGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PlayerGroup[];
  } catch {
    return [];
  }
}

/** Save all player groups */
export function saveGroups(groups: PlayerGroup[]): void {
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {
    // localStorage may be unavailable
  }
}

// ── Selected categories ──────────────────────────────────────

/** Load selected categories (default: [] = all/random) */
export function loadSelectedCategories(): string[] {
  try {
    const raw = localStorage.getItem(SELECTED_CATEGORIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/** Save selected categories */
export function saveSelectedCategories(categories: string[]): void {
  try {
    localStorage.setItem(SELECTED_CATEGORIES_KEY, JSON.stringify(categories));
  } catch {
    // localStorage may be unavailable
  }
}

// ── Mr. White cannot start setting ───────────────────────────

/** Load "Mr. White cannot start" setting (default: true) */
export function loadMrWhiteCannotStart(): boolean {
  try {
    const raw = localStorage.getItem(MRWHITE_CANNOT_START_KEY);
    if (raw === null) return true;
    return JSON.parse(raw) as boolean;
  } catch {
    return true;
  }
}

/** Save "Mr. White cannot start" setting */
export function saveMrWhiteCannotStart(enabled: boolean): void {
  try {
    localStorage.setItem(MRWHITE_CANNOT_START_KEY, JSON.stringify(enabled));
  } catch {
    // localStorage may be unavailable
  }
}

// ── Anti-cheat settings ──────────────────────────────────────

export interface AntiCheatSettings {
  /** Players can peek at their own card during discussion */
  allowPeek: boolean;
  /** Trigger alarm before peeking at own card */
  peekAlarm: boolean;
  /** Players can reveal all cards at once */
  allowShowAll: boolean;
  /** Trigger alarm before revealing all cards */
  showAllAlarm: boolean;
}

const ANTI_CHEAT_DEFAULTS: AntiCheatSettings = {
  allowPeek: true,
  peekAlarm: true,
  allowShowAll: true,
  showAllAlarm: true,
};

/** Load anti-cheat settings */
export function loadAntiCheat(): AntiCheatSettings {
  try {
    const raw = localStorage.getItem(ANTI_CHEAT_KEY);
    if (!raw) return { ...ANTI_CHEAT_DEFAULTS };
    return { ...ANTI_CHEAT_DEFAULTS, ...(JSON.parse(raw) as Partial<AntiCheatSettings>) };
  } catch {
    return { ...ANTI_CHEAT_DEFAULTS };
  }
}

/** Save anti-cheat settings */
export function saveAntiCheat(settings: AntiCheatSettings): void {
  try {
    localStorage.setItem(ANTI_CHEAT_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable
  }
}
