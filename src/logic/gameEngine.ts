import type { EmojiPair, Player } from '../types/game';
import { emojiPairs } from '../data/emojiPairs';
import { assignRoles } from './roles';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/** Pick a random emoji pair from given categories (or all if empty), excluding disabled pairs */
export function pickPair(categories: string[] = [], disabledPairIds: string[] = []): EmojiPair {
  const disabled = new Set(disabledPairIds);
  const catSet = new Set(categories);
  let pool =
    catSet.size > 0
      ? emojiPairs.filter((p) => catSet.has(p.category) && !disabled.has(p.id))
      : emojiPairs.filter((p) => !disabled.has(p.id));
  // Fallback: if everything is disabled, ignore disabled filter
  if (pool.length === 0) {
    pool = catSet.size > 0
      ? emojiPairs.filter((p) => catSet.has(p.category))
      : emojiPairs;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Create the initial player list with roles & emojis assigned */
export function createPlayers(
  names: string[],
  avatarEmojis: string[],
  avatarColors: string[],
  pair: EmojiPair,
  undercoverCount: number,
  mrWhiteCount: number,
): Player[] {
  const roles = assignRoles(names.length, undercoverCount, mrWhiteCount);

  return names.map((name, i) => ({
    id: generateId(),
    name,
    role: roles[i],
    emoji: roles[i] === 'mrwhite' ? null : roles[i] === 'undercover' ? pair.undercover : pair.civil,
    emojiLabel: roles[i] === 'mrwhite' ? null : roles[i] === 'undercover' ? pair.undercoverLabel : pair.civilLabel,
    avatarEmoji: avatarEmojis[i],
    avatarColor: avatarColors[i],
  }));
}
