import { useEffect } from 'react';

/**
 * Attach global pointer/touch listeners while a drag is active.
 *
 * @param active  – whether a drag is currently in progress (e.g. `dragIndex !== null`)
 * @param onMove  – called on pointermove / touchmove (caller extracts coords)
 * @param onEnd   – called on pointerup / pointercancel / touchend / touchcancel
 */
export function useDragListeners(
  active: boolean,
  onMove: (e: PointerEvent | TouchEvent) => void,
  onEnd: () => void,
): void {
  useEffect(() => {
    if (!active) return;

    const handleMove = (e: PointerEvent | TouchEvent) => {
      e.preventDefault();
      onMove(e);
    };

    document.addEventListener('pointermove', handleMove, { passive: false });
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);

    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [active, onMove, onEnd]);
}
