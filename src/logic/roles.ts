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
