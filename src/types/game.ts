export type Role = 'civil' | 'undercover' | 'mrwhite';

export type GamePhase =
  | 'home'
  | 'setup'
  | 'reveal'
  | 'discussion';

export interface Player {
  id: string;
  name: string;
  role: Role;
  emoji: string | null;
  emojiLabel: string | null;
  avatarEmoji: string;
  avatarColor: string;
}

export interface EmojiPair {
  id: string;
  category: string;
  civil: string;
  undercover: string;
  civilLabel: string;
  undercoverLabel: string;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPair: EmojiPair | null;
  currentPlayerIndex: number;
  speakingOrder: number[];
  undercoverCount: number;
  mrWhiteCount: number;
  easyMode: boolean;
  selectedCategories: string[];
  mrWhiteCannotStart: boolean;
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
