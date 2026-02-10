import { describe, it, expect } from 'vitest';
import { encodePairConfig, decodePairConfig } from './pairConfig';
import { emojiPairs } from '../data/emojiPairs';

describe('encodePairConfig', () => {
  it('returns a non-empty string', () => {
    const code = encodePairConfig(new Set());
    expect(code.length).toBeGreaterThan(0);
  });

  it('uses only hex characters (0-9, A-F)', () => {
    const code = encodePairConfig(new Set(['a1', 'f3']));
    expect(code).toMatch(/^[0-9A-F]+$/);
  });

  it('produces different codes for different configs', () => {
    const codeAll = encodePairConfig(new Set());
    const codeSome = encodePairConfig(new Set(['a1', 'a2', 'a3']));
    expect(codeAll).not.toBe(codeSome);
  });

  it('all enabled produces the same code every time', () => {
    const code1 = encodePairConfig(new Set());
    const code2 = encodePairConfig(new Set());
    expect(code1).toBe(code2);
  });
});

describe('decodePairConfig', () => {
  it('round-trips with no disabled pairs', () => {
    const original = new Set<string>();
    const code = encodePairConfig(original);
    const decoded = decodePairConfig(code);
    expect(decoded).not.toBeNull();
    expect(decoded!.size).toBe(0);
  });

  it('round-trips with some disabled pairs', () => {
    const disabled = new Set(['a1', 'f5', 'h10', 'em3']);
    const code = encodePairConfig(disabled);
    const decoded = decodePairConfig(code);
    expect(decoded).not.toBeNull();
    expect(decoded).toEqual(disabled);
  });

  it('round-trips with all pairs disabled', () => {
    const allIds = new Set(emojiPairs.map((p) => p.id));
    const code = encodePairConfig(allIds);
    const decoded = decodePairConfig(code);
    expect(decoded).not.toBeNull();
    expect(decoded!.size).toBe(emojiPairs.length);
    for (const pair of emojiPairs) {
      expect(decoded!.has(pair.id)).toBe(true);
    }
  });

  it('returns null for invalid characters', () => {
    expect(decodePairConfig('!!invalid!!')).toBeNull();
  });

  it('returns null for wrong length', () => {
    expect(decodePairConfig('AAAA')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(decodePairConfig('')).toBeNull();
  });
});

describe('encode/decode symmetry', () => {
  it('code length is exactly 46 hex chars for 183 pairs', () => {
    const code = encodePairConfig(new Set());
    expect(code.length).toBe(46);
  });

  it('preserves exact disabled set through round-trip', () => {
    // Disable every other pair
    const disabled = new Set(
      emojiPairs.filter((_, i) => i % 2 === 0).map((p) => p.id),
    );
    const code = encodePairConfig(disabled);
    const decoded = decodePairConfig(code);
    expect(decoded).toEqual(disabled);
  });
});
