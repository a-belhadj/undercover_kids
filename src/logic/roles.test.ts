import { describe, it, expect } from 'vitest';
import { getRoleDistribution, assignRoles, computeFinalCounts, clampIntrusCounts } from './roles';

describe('getRoleDistribution', () => {
  describe('basic distributions with explicit counts', () => {
    it('3 players, 1 undercover, 0 mrWhite → 2 civil', () => {
      expect(getRoleDistribution(3, 1, 0)).toEqual({ civil: 2, undercover: 1, mrwhite: 0 });
    });

    it('4 players, 1 undercover, 1 mrWhite → 2 civil', () => {
      expect(getRoleDistribution(4, 1, 1)).toEqual({ civil: 2, undercover: 1, mrwhite: 1 });
    });

    it('5 players, 1 undercover, 1 mrWhite → 3 civil', () => {
      expect(getRoleDistribution(5, 1, 1)).toEqual({ civil: 3, undercover: 1, mrwhite: 1 });
    });

    it('6 players, 2 undercover, 1 mrWhite → 3 civil', () => {
      expect(getRoleDistribution(6, 2, 1)).toEqual({ civil: 3, undercover: 2, mrwhite: 1 });
    });

    it('8 players, 2 undercover, 2 mrWhite → 4 civil', () => {
      expect(getRoleDistribution(8, 2, 2)).toEqual({ civil: 4, undercover: 2, mrwhite: 2 });
    });

    it('10 players, 3 undercover, 2 mrWhite → 5 civil', () => {
      expect(getRoleDistribution(10, 3, 2)).toEqual({ civil: 5, undercover: 3, mrwhite: 2 });
    });

    it('16 players, 4 undercover, 4 mrWhite → 8 civil', () => {
      expect(getRoleDistribution(16, 4, 4)).toEqual({ civil: 8, undercover: 4, mrwhite: 4 });
    });
  });

  describe('no undercover (mr white only)', () => {
    it('4 players, 0 undercover, 1 mrWhite → 3 civil', () => {
      expect(getRoleDistribution(4, 0, 1)).toEqual({ civil: 3, undercover: 0, mrwhite: 1 });
    });

    it('6 players, 0 undercover, 2 mrWhite → 4 civil', () => {
      expect(getRoleDistribution(6, 0, 2)).toEqual({ civil: 4, undercover: 0, mrwhite: 2 });
    });
  });

  describe('no mr white (undercover only)', () => {
    it('4 players, 1 undercover, 0 mrWhite → 3 civil', () => {
      expect(getRoleDistribution(4, 1, 0)).toEqual({ civil: 3, undercover: 1, mrwhite: 0 });
    });

    it('6 players, 2 undercover, 0 mrWhite → 4 civil', () => {
      expect(getRoleDistribution(6, 2, 0)).toEqual({ civil: 4, undercover: 2, mrwhite: 0 });
    });

    it('8 players, 3 undercover, 0 mrWhite → 5 civil', () => {
      expect(getRoleDistribution(8, 3, 0)).toEqual({ civil: 5, undercover: 3, mrwhite: 0 });
    });
  });

  describe('clamping: never more than half special roles', () => {
    it('4 players, 3 undercover, 0 mrWhite → clamps to 2 undercover', () => {
      expect(getRoleDistribution(4, 3, 0)).toEqual({ civil: 2, undercover: 2, mrwhite: 0 });
    });

    it('5 players, 5 undercover, 5 mrWhite → clamps to 2 uc + 0 mw', () => {
      const dist = getRoleDistribution(5, 5, 5);
      expect(dist.undercover + dist.mrwhite).toBeLessThanOrEqual(2);
      expect(dist.civil + dist.undercover + dist.mrwhite).toBe(5);
    });

    it('3 players, 1 undercover, 1 mrWhite → clamps mrWhite to 0 (maxSpecial=1)', () => {
      expect(getRoleDistribution(3, 1, 1)).toEqual({ civil: 2, undercover: 1, mrwhite: 0 });
    });

    it('6 players, 4 undercover, 2 mrWhite → clamps uc=3, mw=0', () => {
      const dist = getRoleDistribution(6, 4, 2);
      expect(dist.undercover + dist.mrwhite).toBeLessThanOrEqual(3);
      expect(dist.civil + dist.undercover + dist.mrwhite).toBe(6);
    });
  });

  describe('total roles always equal player count', () => {
    const cases: [number, number, number][] = [
      [3, 1, 0], [4, 1, 1], [5, 2, 0], [6, 1, 1],
      [7, 2, 1], [8, 2, 2], [10, 3, 2], [16, 4, 4],
      [4, 0, 1], [6, 0, 2],
    ];

    for (const [pc, uc, mw] of cases) {
      it(`totals ${pc} for (${pc}, ${uc}, ${mw})`, () => {
        const dist = getRoleDistribution(pc, uc, mw);
        expect(dist.civil + dist.undercover + dist.mrwhite).toBe(pc);
      });
    }
  });

  describe('civils always at least majority (>= special)', () => {
    const cases: [number, number, number][] = [
      [3, 1, 0], [4, 1, 1], [5, 2, 1], [6, 3, 0],
      [8, 4, 0], [10, 5, 0], [16, 8, 0],
    ];

    for (const [pc, uc, mw] of cases) {
      it(`civils >= special for (${pc}, ${uc}, ${mw})`, () => {
        const dist = getRoleDistribution(pc, uc, mw);
        expect(dist.civil).toBeGreaterThanOrEqual(dist.undercover + dist.mrwhite);
      });
    }

    it('civils strictly > special when fewer than half are requested', () => {
      const dist = getRoleDistribution(6, 1, 1);
      expect(dist.civil).toBeGreaterThan(dist.undercover + dist.mrwhite);
    });
  });
});

describe('assignRoles', () => {
  describe('returns array of correct length', () => {
    const cases: [number, number, number][] = [
      [3, 1, 0], [4, 1, 1], [5, 2, 0], [6, 1, 1],
      [8, 2, 2], [10, 3, 2], [16, 4, 4],
    ];

    for (const [pc, uc, mw] of cases) {
      it(`returns ${pc} roles for (${pc}, ${uc}, ${mw})`, () => {
        expect(assignRoles(pc, uc, mw)).toHaveLength(pc);
      });
    }
  });

  describe('contains the right count of each role type', () => {
    const countRoles = (roles: string[]) => ({
      civil: roles.filter((r) => r === 'civil').length,
      undercover: roles.filter((r) => r === 'undercover').length,
      mrwhite: roles.filter((r) => r === 'mrwhite').length,
    });

    const cases: [number, number, number][] = [
      [3, 1, 0], [4, 1, 1], [5, 1, 0], [6, 2, 1],
      [8, 2, 2], [4, 0, 1], [6, 0, 2],
    ];

    for (const [pc, uc, mw] of cases) {
      it(`matches expected distribution for (${pc}, ${uc}, ${mw})`, () => {
        const roles = assignRoles(pc, uc, mw);
        const dist = getRoleDistribution(pc, uc, mw);
        expect(countRoles(roles)).toEqual(dist);
      });
    }
  });

  describe('contains only valid role strings', () => {
    const validRoles = new Set(['civil', 'undercover', 'mrwhite']);

    for (const pc of [3, 4, 5, 6, 7, 8, 10, 16]) {
      it(`only contains valid roles for ${pc} players`, () => {
        const roles = assignRoles(pc, 1, 1);
        for (const role of roles) {
          expect(validRoles.has(role)).toBe(true);
        }
      });
    }
  });

  describe('with mrWhiteCount=0, never includes mrwhite role', () => {
    for (const pc of [3, 4, 5, 6, 7, 8]) {
      it(`does not contain mrwhite for ${pc} players`, () => {
        const roles = assignRoles(pc, 1, 0);
        expect(roles).not.toContain('mrwhite');
      });
    }
  });

  describe('with undercoverCount=0, never includes undercover role', () => {
    for (const pc of [4, 5, 6, 7, 8]) {
      it(`does not contain undercover for ${pc} players`, () => {
        const roles = assignRoles(pc, 0, 1);
        expect(roles).not.toContain('undercover');
      });
    }
  });

  describe('shuffle produces varying orderings', () => {
    it('produces at least 2 different orderings over 50 runs', () => {
      const seen = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const roles = assignRoles(6, 1, 1);
        seen.add(roles.join(','));
      }
      expect(seen.size).toBeGreaterThanOrEqual(2);
    });

    it('produces at least 2 different orderings for 8 players over 50 runs', () => {
      const seen = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const roles = assignRoles(8, 2, 0);
        seen.add(roles.join(','));
      }
      expect(seen.size).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('computeFinalCounts', () => {
  it('returns all MW when undercover disabled', () => {
    expect(computeFinalCounts({
      intrusCount: 3, undercoverEnabled: false, mrWhiteEnabled: true,
      randomSplit: false, undercoverCount: 2, mrWhiteCount: 1,
    })).toEqual({ finalUC: 0, finalMW: 3 });
  });

  it('returns all UC when mrWhite disabled', () => {
    expect(computeFinalCounts({
      intrusCount: 2, undercoverEnabled: true, mrWhiteEnabled: false,
      randomSplit: false, undercoverCount: 1, mrWhiteCount: 1,
    })).toEqual({ finalUC: 2, finalMW: 0 });
  });

  it('uses manual split when both enabled and randomSplit off', () => {
    expect(computeFinalCounts({
      intrusCount: 3, undercoverEnabled: true, mrWhiteEnabled: true,
      randomSplit: false, undercoverCount: 2, mrWhiteCount: 1,
    })).toEqual({ finalUC: 2, finalMW: 1 });
  });

  it('random split sums to intrusCount', () => {
    for (let i = 0; i < 20; i++) {
      const { finalUC, finalMW } = computeFinalCounts({
        intrusCount: 4, undercoverEnabled: true, mrWhiteEnabled: true,
        randomSplit: true, undercoverCount: 0, mrWhiteCount: 0,
      });
      expect(finalUC + finalMW).toBe(4);
      expect(finalUC).toBeGreaterThanOrEqual(0);
      expect(finalMW).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('clampIntrusCounts', () => {
  it('clamps intrusCount to maxSpecial', () => {
    const result = clampIntrusCounts(4, {
      intrusCount: 5, undercoverEnabled: true, mrWhiteEnabled: false,
      randomSplit: false, undercoverCount: 5, mrWhiteCount: 0,
    });
    expect(result.intrusCount).toBe(2);
    expect(result.undercoverCount).toBe(2);
    expect(result.mrWhiteCount).toBe(0);
  });

  it('forces UC=ic MW=0 when mrWhite disabled', () => {
    const result = clampIntrusCounts(6, {
      intrusCount: 2, undercoverEnabled: true, mrWhiteEnabled: false,
      randomSplit: false, undercoverCount: 1, mrWhiteCount: 1,
    });
    expect(result).toEqual({ intrusCount: 2, undercoverCount: 2, mrWhiteCount: 0 });
  });

  it('forces UC=0 MW=ic when undercover disabled', () => {
    const result = clampIntrusCounts(6, {
      intrusCount: 2, undercoverEnabled: false, mrWhiteEnabled: true,
      randomSplit: false, undercoverCount: 1, mrWhiteCount: 1,
    });
    expect(result).toEqual({ intrusCount: 2, undercoverCount: 0, mrWhiteCount: 2 });
  });

  it('adjusts MW to match IC - UC when both enabled manual split', () => {
    const result = clampIntrusCounts(8, {
      intrusCount: 3, undercoverEnabled: true, mrWhiteEnabled: true,
      randomSplit: false, undercoverCount: 2, mrWhiteCount: 0,
    });
    expect(result).toEqual({ intrusCount: 3, undercoverCount: 2, mrWhiteCount: 1 });
  });

  it('does not touch sub-counts when randomSplit is on', () => {
    const result = clampIntrusCounts(8, {
      intrusCount: 3, undercoverEnabled: true, mrWhiteEnabled: true,
      randomSplit: true, undercoverCount: 5, mrWhiteCount: 7,
    });
    expect(result).toEqual({ intrusCount: 3, undercoverCount: 5, mrWhiteCount: 7 });
  });

  it('ensures intrusCount >= 1', () => {
    const result = clampIntrusCounts(6, {
      intrusCount: 0, undercoverEnabled: true, mrWhiteEnabled: false,
      randomSplit: false, undercoverCount: 0, mrWhiteCount: 0,
    });
    expect(result.intrusCount).toBe(1);
    expect(result.undercoverCount).toBe(1);
  });

  it('handles UC negative edge case', () => {
    const result = clampIntrusCounts(6, {
      intrusCount: 2, undercoverEnabled: true, mrWhiteEnabled: true,
      randomSplit: false, undercoverCount: 5, mrWhiteCount: 0,
    });
    // uc=5, mw = 2-5 = -3 → mw=0, uc=2
    expect(result).toEqual({ intrusCount: 2, undercoverCount: 2, mrWhiteCount: 0 });
  });
});
