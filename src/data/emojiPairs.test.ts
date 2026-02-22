import { describe, it, expect } from 'vitest';
import { CATEGORIES, emojiPairs } from './emojiPairs';

describe('CATEGORIES', () => {
  it('has 14 categories', () => {
    expect(CATEGORIES).toHaveLength(14);
  });

  it('each category has id, label, and icon', () => {
    for (const category of CATEGORIES) {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('label');
      expect(category).toHaveProperty('icon');
      expect(typeof category.id).toBe('string');
      expect(typeof category.label).toBe('string');
      expect(typeof category.icon).toBe('string');
    }
  });

  it('all expected category ids are present', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toContain('animals');
    expect(ids).toContain('fruits');
    expect(ids).toContain('vehicles');
    expect(ids).toContain('food');
    expect(ids).toContain('nature');
    expect(ids).toContain('objects');
    expect(ids).toContain('heroes');
    expect(ids).toContain('clothes');
    expect(ids).toContain('music');
    expect(ids).toContain('house');
    expect(ids).toContain('emotions');
    expect(ids).toContain('body');
    expect(ids).toContain('cartoons');
    expect(ids).toContain('carbrands');
  });
});

describe('emojiPairs', () => {
  it(`has ${emojiPairs.length} pairs total`, () => {
    expect(emojiPairs.length).toBeGreaterThan(0);
  });

  it('each pair has id, category, civil, undercover, civilLabel, and undercoverLabel', () => {
    for (const pair of emojiPairs) {
      expect(pair).toHaveProperty('id');
      expect(pair).toHaveProperty('category');
      expect(pair).toHaveProperty('civil');
      expect(pair).toHaveProperty('undercover');
      expect(pair).toHaveProperty('civilLabel');
      expect(pair).toHaveProperty('undercoverLabel');
      expect(typeof pair.id).toBe('string');
      expect(typeof pair.category).toBe('string');
      expect(typeof pair.civil).toBe('string');
      expect(typeof pair.undercover).toBe('string');
      expect(typeof pair.civilLabel).toBe('string');
      expect(typeof pair.undercoverLabel).toBe('string');
    }
  });

  it('all labels are non-empty strings', () => {
    for (const pair of emojiPairs) {
      expect(pair.civilLabel.length).toBeGreaterThan(0);
      expect(pair.undercoverLabel.length).toBeGreaterThan(0);
    }
  });

  it('all ids are unique', () => {
    const ids = emojiPairs.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has at least 5 pairs per category', () => {
    const counts: Record<string, number> = {};
    for (const pair of emojiPairs) {
      counts[pair.category] = (counts[pair.category] ?? 0) + 1;
    }
    for (const category of CATEGORIES) {
      expect(counts[category.id]).toBeGreaterThanOrEqual(5);
    }
  });

  it('civil and undercover are never the same emoji in a pair', () => {
    for (const pair of emojiPairs) {
      expect(pair.civil).not.toBe(pair.undercover);
    }
  });

  it('all category values correspond to a valid CATEGORIES id', () => {
    const validIds = new Set<string>(CATEGORIES.map((c) => c.id));
    for (const pair of emojiPairs) {
      expect(validIds.has(pair.category)).toBe(true);
    }
  });

  it('heroes pairs use image URLs', () => {
    const heroesPairs = emojiPairs.filter((p) => p.category === 'heroes');
    expect(heroesPairs.length).toBeGreaterThan(0);
    for (const pair of heroesPairs) {
      expect(pair.civil).toMatch(/^https?:\/\//);
      expect(pair.undercover).toMatch(/^https?:\/\//);
    }
  });

  it('cartoons pairs use image URLs', () => {
    const cartoonsPairs = emojiPairs.filter((p) => p.category === 'cartoons');
    expect(cartoonsPairs.length).toBeGreaterThan(0);
    for (const pair of cartoonsPairs) {
      expect(pair.civil).toMatch(/^https?:\/\//);
      expect(pair.undercover).toMatch(/^https?:\/\//);
    }
  });
});
