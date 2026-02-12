import type { Role } from '../types/game';

interface RoleDistribution {
  civil: number;
  undercover: number;
  mrwhite: number;
}

/**
 * Compute role distribution from explicit counts.
 * Civil count = playerCount - undercoverCount - mrWhiteCount.
 * Clamps to ensure at least 1 civil and valid totals.
 */
export function getRoleDistribution(
  playerCount: number,
  undercoverCount: number,
  mrWhiteCount: number,
): RoleDistribution {
  // Clamp special roles: never more than half the players
  const maxSpecial = Math.floor(playerCount / 2);
  const uc = Math.max(0, Math.min(undercoverCount, maxSpecial));
  const mw = Math.max(0, Math.min(mrWhiteCount, maxSpecial - uc));
  const civil = playerCount - uc - mw;

  return { civil, undercover: uc, mrwhite: mw };
}

export interface IntrusConfig {
  intrusCount: number;
  undercoverEnabled: boolean;
  mrWhiteEnabled: boolean;
  randomSplit: boolean;
  undercoverCount: number;
  mrWhiteCount: number;
}

/**
 * Compute the final UC/MW counts from the intrus configuration.
 * Pure function — no side effects.
 */
export function computeFinalCounts(config: IntrusConfig): { finalUC: number; finalMW: number } {
  const { intrusCount, undercoverEnabled, mrWhiteEnabled, randomSplit, undercoverCount, mrWhiteCount } = config;
  if (!undercoverEnabled) {
    return { finalUC: 0, finalMW: intrusCount };
  }
  if (!mrWhiteEnabled) {
    return { finalUC: intrusCount, finalMW: 0 };
  }
  // Both enabled
  if (randomSplit) {
    // Random split: each can be 0, sum = intrusCount
    const finalMW = Math.floor(Math.random() * (intrusCount + 1));
    return { finalUC: intrusCount - finalMW, finalMW };
  }
  // Manual split: use stored sub-counts
  return { finalUC: undercoverCount, finalMW: mrWhiteCount };
}

/**
 * Clamp intrus sub-counts so they are consistent with playerCount and enabled flags.
 * Returns the clamped values for intrusCount, undercoverCount, and mrWhiteCount.
 */
export function clampIntrusCounts(
  playerCount: number,
  config: IntrusConfig,
): { intrusCount: number; undercoverCount: number; mrWhiteCount: number } {
  const { undercoverEnabled, mrWhiteEnabled, randomSplit } = config;
  const maxSpecial = Math.floor(playerCount / 2);
  const ic = Math.max(1, Math.min(config.intrusCount, maxSpecial));

  if (!mrWhiteEnabled) {
    return { intrusCount: ic, undercoverCount: ic, mrWhiteCount: 0 };
  }
  if (!undercoverEnabled) {
    return { intrusCount: ic, undercoverCount: 0, mrWhiteCount: ic };
  }
  if (randomSplit) {
    return { intrusCount: ic, undercoverCount: config.undercoverCount, mrWhiteCount: config.mrWhiteCount };
  }
  // Both enabled, manual split: ensure UC + MW = ic, each >= 0
  let uc = config.undercoverCount;
  let mw = config.mrWhiteCount;
  if (uc + mw !== ic) {
    mw = ic - uc;
    if (mw < 0) { mw = 0; uc = ic; }
    if (uc < 0) { uc = 0; mw = ic; }
  }
  return { intrusCount: ic, undercoverCount: uc, mrWhiteCount: mw };
}

export function assignRoles(
  playerCount: number,
  undercoverCount: number,
  mrWhiteCount: number,
): Role[] {
  const dist = getRoleDistribution(playerCount, undercoverCount, mrWhiteCount);
  const roles: Role[] = [
    ...Array<Role>(dist.civil).fill('civil'),
    ...Array<Role>(dist.undercover).fill('undercover'),
    ...Array<Role>(dist.mrwhite).fill('mrwhite'),
  ];

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  return roles;
}
