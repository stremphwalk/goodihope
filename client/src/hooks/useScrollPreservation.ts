import { useRef, useCallback } from 'react';

export function useScrollPreservation() {
  const scrollPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement | null>(null);

  const preserveScrollPosition = useCallback(() => {
    if (containerRef.current) {
      scrollPositionRef.current = {
        x: containerRef.current.scrollLeft,
        y: containerRef.current.scrollTop
      };
    } else {
      // Fallback to window scroll position
      scrollPositionRef.current = {
        x: window.scrollX,
        y: window.scrollY
      };
    }
  }, []);

  const restoreScrollPosition = useCallback(() => {
    const restore = () => {
      if (containerRef.current) {
        containerRef.current.scrollTo(
          scrollPositionRef.current.x,
          scrollPositionRef.current.y
        );
      } else {
        // Fallback to window scroll position
        window.scrollTo(
          scrollPositionRef.current.x,
          scrollPositionRef.current.y
        );
      }
    };

    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(restore);
  }, []);

  const setContainer = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  return {
    preserveScrollPosition,
    restoreScrollPosition,
    setContainer,
    containerRef
  };
}