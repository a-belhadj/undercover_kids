export type Role = 'civil' | 'undercover' | 'mrwhite';

export type PairDisplayMode = 'both' | 'icon' | 'text';

export type GamePhase =
  | 'home'
  | 'setup'
  | 'reveal'
  | 'discussion'
  | 'result';

export type Winner = 'civil' | 'intrus';

export interface Player {
  id: string;
  name: string;
  role: Role;
  emoji: string | null;
  emojiLabel: string | null;
  avatarEmoji: string;
  avatarColor: string;
  eliminated: boolean;
}

export interface EmojiPair {
  id: string;
  category: string;
  civil: string;
  undercover: string;
  civilLabel: string;
  undercoverLabel: string;
}

export interface CheatLog {
  peekCounts: Record<number, number>;
  showAllCount: number;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPair: EmojiPair | null;
  currentPlayerIndex: number;
  speakingOrder: number[];
  winner: Winner | null;
  cheatLog: CheatLog;
  undercoverCount: number;
  mrWhiteCount: number;
  intrusCount: number;
  undercoverEnabled: boolean;
  mrWhiteEnabled: boolean;
  randomSplit: boolean;
  easyMode: boolean;
  selectedCategories: string[];
  mrWhiteCannotStart: boolean;
  pairDisplayMode: PairDisplayMode;
}

export const AVATAR_EMOJIS = [
  '🐶', '🐱', '🐸', '🐰', '🦊', '🐼', '🦁', '🐧',
  '🐯', '🐮', '🐷', '🐵', '🦄', '🐲', '🦋', '🐢',
  'https://img.icons8.com/color/96/spiderman-head.png',
  'https://img.icons8.com/color/96/batman.png',
  'https://img.icons8.com/color/96/superman.png',
  'https://img.icons8.com/color/96/iron-man.png',
  'https://img.icons8.com/color/96/hulk.png',
  'https://img.icons8.com/color/96/captain-america.png',
  'https://img.icons8.com/color/96/wonder-woman.png',
  'https://img.icons8.com/color/96/deadpool.png',
] as const;

export const AVATAR_COLORS = [
  '#E17055',
  '#00B894',
  '#6C5CE7',
  '#FD79A8',
  '#FDCB6E',
  '#00CEC9',
  '#E84393',
  '#55A3E7',
  '#A29BFE',
  '#FF7675',
  '#74B9FF',
  '#81ECEC',
  '#FAB1A0',
  '#DFE6E9',
  '#B2BEC3',
  '#636E72',
] as const;

/** A player saved in the persistent roster */
export interface RosterPlayer {
  id: string;
  name: string;
  avatarEmoji: string;
  avatarColor: string;
}

/** A named group of roster player ids */
export interface PlayerGroup {
  id: string;
  name: string;
  playerIds: string[];
}
