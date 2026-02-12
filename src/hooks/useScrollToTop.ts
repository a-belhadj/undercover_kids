import { useEffect } from 'react';

export function useScrollToTop(): void {
  useEffect(() => {
    document.getElementById('root')?.scrollTo(0, 0);
  }, []);
}
