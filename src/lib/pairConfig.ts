import { emojiPairs } from '../data/emojiPairs';

/**
 * Encode disabled pair ids into a compact hex string.
 *
 * Each pair in emojiPairs maps to one bit (ordered by index).
 * Bit = 1 means enabled, 0 means disabled.
 * The bits are packed into bytes, then encoded as uppercase hex.
 *
 * With 175 pairs → ceil(175/8) = 22 bytes → 44 hex characters.
 */
export function encodePairConfig(disabledIds: Set<string>): string {
  const numPairs = emojiPairs.length;
  const numBytes = Math.ceil(numPairs / 8);
  const bytes = new Uint8Array(numBytes);

  for (let i = 0; i < numPairs; i++) {
    const enabled = !disabledIds.has(emojiPairs[i].id);
    if (enabled) {
      bytes[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    }
  }

  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
}

/**
 * Decode a hex string back into a Set of disabled pair ids.
 * Returns null if the code is invalid.
 */
export function decodePairConfig(code: string): Set<string> | null {
  try {
    const hex = code.trim().toUpperCase();

    // Must be hex characters only
    if (!/^[0-9A-F]+$/.test(hex)) {
      return null;
    }

    const numPairs = emojiPairs.length;
    const expectedBytes = Math.ceil(numPairs / 8);

    if (hex.length !== expectedBytes * 2) {
      return null;
    }

    const bytes = new Uint8Array(expectedBytes);
    for (let i = 0; i < expectedBytes; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }

    const disabledIds = new Set<string>();
    for (let i = 0; i < numPairs; i++) {
      const bit = (bytes[Math.floor(i / 8)] >> (7 - (i % 8))) & 1;
      if (bit === 0) {
        disabledIds.add(emojiPairs[i].id);
      }
    }

    return disabledIds;
  } catch {
    return null;
  }
}
