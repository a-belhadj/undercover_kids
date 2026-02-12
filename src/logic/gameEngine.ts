import type { EmojiPair, Player, Winner } from '../types/game';
import { emojiPairs } from '../data/emojiPairs';
import { assignRoles } from './roles';
import { generateId } from '../lib/generateId';
import { shuffle } from '../lib/shuffle';

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
    eliminated: false,
  }));
}

/**
 * Build a randomised speaking order for the discussion phase.
 *
 * @param players      The full player list
 * @param mrWhiteCannotStart  If true, ensures the first speaker is never a Mr. White
 * @returns A new array of player indices in speaking order
 */
export function buildSpeakingOrder(
  players: Player[],
  mrWhiteCannotStart: boolean,
): number[] {
  const indices = shuffle(players.map((_, i) => i));

  if (mrWhiteCannotStart && indices.length > 1) {
    // If the first index points to a Mr. White, swap it with the first non-Mr. White
    if (players[indices[0]].role === 'mrwhite') {
      const swapIdx = indices.findIndex((idx) => players[idx].role !== 'mrwhite');
      if (swapIdx !== -1) {
        [indices[0], indices[swapIdx]] = [indices[swapIdx], indices[0]];
      }
    }
  }

  return indices;
}

/**
 * Check if the game is over after an elimination.
 *
 * - Civils win when all undercovers AND all Mr. Whites are eliminated.
 * - Intrus win when all civils are eliminated.
 *
 * @returns The winning side, or null if the game continues.
 */
export function checkGameOver(players: Player[]): Winner | null {
  const alive = players.filter((p) => !p.eliminated);
  const aliveIntrus = alive.some((p) => p.role === 'undercover' || p.role === 'mrwhite');
  const aliveCivils = alive.some((p) => p.role === 'civil');

  if (!aliveIntrus) return 'civil';
  if (!aliveCivils) return 'intrus';
  return null;
}
