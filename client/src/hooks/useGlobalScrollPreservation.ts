import { useEffect, useRef, useCallback } from 'react';

interface GlobalScrollPosition {
  x: number;
  y: number;
  timestamp: number;
  route: string;
}

// Global storage for scroll positions across re-renders
const scrollPositionStorage = new Map<string, GlobalScrollPosition>();

export function useGlobalScrollPreservation(routeKey: string = 'default') {
  const preserveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPreservingRef = useRef(false);

  const preserveScrollPosition = useCallback(() => {
    if (isPreservingRef.current) return;
    
    try {
      isPreservingRef.current = true;
      
      // Clear any pending preserve operations
      if (preserveTimeoutRef.current) {
        clearTimeout(preserveTimeoutRef.current);
      }

      // Get current scroll position with cross-browser compatibility
      let scrollX = 0;
      let scrollY = 0;

      if (window.scrollX !== undefined && window.scrollY !== undefined) {
        scrollX = window.scrollX;
        scrollY = window.scrollY;
      } else if (document.documentElement) {
        scrollX = document.documentElement.scrollLeft || 0;
        scrollY = document.documentElement.scrollTop || 0;
      } else if (document.body) {
        scrollX = document.body.scrollLeft || 0;
        scrollY = document.body.scrollTop || 0;
      }

      // Store globally to survive component re-renders
      scrollPositionStorage.set(routeKey, {
        x: scrollX,
        y: scrollY,
        timestamp: Date.now(),
        route: routeKey
      });

      console.debug('🎯 Global scroll preserved:', { x: scrollX, y: scrollY, route: routeKey });
    } catch (error) {
      console.warn('Error preserving global scroll position:', error);
    } finally {
      isPreservingRef.current = false;
    }
  }, [routeKey]);

  const restoreScrollPosition = useCallback(() => {
    const position = scrollPositionStorage.get(routeKey);
    
    if (!position || Date.now() - position.timestamp > 30000) {
      console.debug('No valid scroll position to restore for:', routeKey);
      return;
    }

    // Clear any pending restore operations
    if (restoreTimeoutRef.current) {
      clearTimeout(restoreTimeoutRef.current);
    }

    const performRestore = () => {
      try {
        const targetX = Math.max(0, position.x);
        const targetY = Math.max(0, position.y);

        // Use multiple restoration strategies for reliability
        if (window.scrollTo && typeof window.scrollTo === 'function') {
          if ('behavior' in document.documentElement.style) {
            window.scrollTo({
              left: targetX,
              top: targetY,
              behavior: 'instant'
            });
          } else {
            window.scrollTo(targetX, targetY);
          }
        } else if (document.documentElement) {
          document.documentElement.scrollLeft = targetX;
          document.documentElement.scrollTop = targetY;
        } else if (document.body) {
          document.body.scrollLeft = targetX;
          document.body.scrollTop = targetY;
        }

        console.debug('🎯 Global scroll restored:', { x: targetX, y: targetY, route: routeKey });
      } catch (error) {
        console.warn('Error restoring global scroll position:', error);
      }
    };

    // Multiple restoration attempts to handle different render timings
    requestAnimationFrame(() => {
      performRestore();
      
      // Additional delayed attempts
      restoreTimeoutRef.current = setTimeout(performRestore, 16);
      setTimeout(performRestore, 50);
      setTimeout(performRestore, 100);
    });
  }, [routeKey]);

  // Preserve scroll position before component updates
  const preserveBeforeUpdate = useCallback(() => {
    preserveScrollPosition();
  }, [preserveScrollPosition]);

  // Auto-preserve on page interactions
  useEffect(() => {
    const handleBeforeUnload = () => preserveScrollPosition();
    const handleScroll = () => {
      // Debounced preserve during scrolling
      if (preserveTimeoutRef.current) {
        clearTimeout(preserveTimeoutRef.current);
      }
      preserveTimeoutRef.current = setTimeout(preserveScrollPosition, 100);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
      
      if (preserveTimeoutRef.current) {
        clearTimeout(preserveTimeoutRef.current);
      }
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, [preserveScrollPosition]);

  // Auto-restore after mount/update
  useEffect(() => {
    restoreScrollPosition();
  });

  return {
    preserveBeforeUpdate,
    restoreScrollPosition,
    preserveScrollPosition
  };
}