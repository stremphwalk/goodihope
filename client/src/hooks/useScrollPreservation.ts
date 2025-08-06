import { useRef, useCallback, useEffect } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

export function useScrollPreservation() {
  const scrollPositionRef = useRef<ScrollPosition>({ x: 0, y: 0, timestamp: 0 });
  const containerRef = useRef<HTMLElement | null>(null);
  const isRestoringRef = useRef(false);
  const restoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const performanceMetricsRef = useRef({ 
    preserveCount: 0, 
    restoreCount: 0, 
    failCount: 0,
    lastResetTime: Date.now() 
  });

  const preserveScrollPosition = useCallback(() => {
    // Performance monitoring and throttling
    const metrics = performanceMetricsRef.current;
    const now = Date.now();
    
    // Reset metrics every minute
    if (now - metrics.lastResetTime > 60000) {
      console.debug('Scroll metrics (last minute):', metrics);
      metrics.preserveCount = 0;
      metrics.restoreCount = 0;
      metrics.failCount = 0;
      metrics.lastResetTime = now;
    }
    
    // Throttle excessive preserve calls (max 20 per second)
    metrics.preserveCount++;
    if (metrics.preserveCount > 20 && now - metrics.lastResetTime < 1000) {
      console.warn('Scroll preservation throttled due to excessive calls');
      return;
    }

    // Clear any pending restore operations
    if (restoreTimeoutRef.current) {
      clearTimeout(restoreTimeoutRef.current);
      restoreTimeoutRef.current = null;
    }
    
    if (containerRef.current) {
      scrollPositionRef.current = {
        x: containerRef.current.scrollLeft,
        y: containerRef.current.scrollTop,
        timestamp: now
      };
    } else {
      // Cross-browser scroll position detection
      let scrollX = 0;
      let scrollY = 0;
      
      try {
        // Modern browsers
        if (window.scrollX !== undefined && window.scrollY !== undefined) {
          scrollX = window.scrollX;
          scrollY = window.scrollY;
        } 
        // IE and older browsers
        else if (document.documentElement && 
                 document.documentElement.scrollLeft !== undefined && 
                 document.documentElement.scrollTop !== undefined) {
          scrollX = document.documentElement.scrollLeft;
          scrollY = document.documentElement.scrollTop;
        }
        // Body fallback
        else if (document.body && 
                 document.body.scrollLeft !== undefined && 
                 document.body.scrollTop !== undefined) {
          scrollX = document.body.scrollLeft;
          scrollY = document.body.scrollTop;
        }
        // Page offset fallback
        else if (window.pageXOffset !== undefined && window.pageYOffset !== undefined) {
          scrollX = window.pageXOffset;
          scrollY = window.pageYOffset;
        }
      } catch (error) {
        console.warn('Error detecting scroll position, using defaults:', error);
        scrollX = 0;
        scrollY = 0;
      }

      scrollPositionRef.current = {
        x: scrollX,
        y: scrollY,
        timestamp: now
      };
    }

    // Debug logging
    console.debug('Scroll position preserved:', scrollPositionRef.current);
  }, []);

  const restoreScrollPosition = useCallback((strategy: 'immediate' | 'delayed' | 'comprehensive' = 'comprehensive') => {
    // Prevent multiple simultaneous restore operations
    if (isRestoringRef.current) {
      console.debug('Scroll restore already in progress, skipping');
      return;
    }

    // Clear any existing timeout
    if (restoreTimeoutRef.current) {
      clearTimeout(restoreTimeoutRef.current);
      restoreTimeoutRef.current = null;
    }

    const performRestore = () => {
      try {
        const position = scrollPositionRef.current;
        
        // Only restore if we have a valid recent position
        if (position.timestamp > 0 && Date.now() - position.timestamp < 10000) { // Extended to 10s
          const targetX = Math.max(0, position.x);
          const targetY = Math.max(0, position.y);
          
          if (containerRef.current) {
            // Check if container still exists and is connected
            if (containerRef.current.isConnected) {
              containerRef.current.scrollTo({
                left: targetX,
                top: targetY,
                behavior: 'instant'
              });
            }
          } else {
            // Cross-browser compatible scrolling
            try {
              if (window.scrollTo && typeof window.scrollTo === 'function') {
                // Modern browsers
                if ('behavior' in document.documentElement.style) {
                  window.scrollTo({
                    left: targetX,
                    top: targetY,
                    behavior: 'instant'
                  });
                } else {
                  // Fallback for older browsers
                  window.scrollTo(targetX, targetY);
                }
              } else if (document.documentElement && document.documentElement.scrollTop !== undefined) {
                // IE fallback
                document.documentElement.scrollLeft = targetX;
                document.documentElement.scrollTop = targetY;
              } else if (document.body) {
                // Older browser fallback
                document.body.scrollLeft = targetX;
                document.body.scrollTop = targetY;
              }
            } catch (scrollError) {
              console.warn('Cross-browser scroll fallback failed:', scrollError);
              // Final fallback
              try {
                window.scroll(targetX, targetY);
              } catch (finalError) {
                console.error('All scroll methods failed:', finalError);
              }
            }
          }
          
          console.debug('Scroll position restored:', { x: targetX, y: targetY, strategy });
          return true;
        } else {
          console.debug('Scroll position too old or invalid:', position);
          performanceMetricsRef.current.failCount++;
          return false;
        }
      } catch (error) {
        console.warn('Error restoring scroll position:', error);
        performanceMetricsRef.current.failCount++;
        return false;
      }
    };

    const cleanup = () => {
      isRestoringRef.current = false;
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
        restoreTimeoutRef.current = null;
      }
    };

    // Different strategies based on use case
    switch (strategy) {
      case 'immediate':
        isRestoringRef.current = true;
        const success = performRestore();
        cleanup();
        return;
        
      case 'delayed':
        isRestoringRef.current = true;
        restoreTimeoutRef.current = setTimeout(() => {
          performRestore();
          cleanup();
        }, 16);
        return;
        
      case 'comprehensive':
      default:
        isRestoringRef.current = true;
        
        // Multi-stage restoration strategy
        requestAnimationFrame(() => {
          const immediateSuccess = performRestore();
          
          if (!immediateSuccess) {
            // If immediate restore failed, try delayed
            restoreTimeoutRef.current = setTimeout(() => {
              const delayedSuccess = performRestore();
              
              if (!delayedSuccess) {
                // Final attempt after layout stabilizes
                setTimeout(() => {
                  performRestore();
                  cleanup();
                }, 100);
              } else {
                cleanup();
              }
            }, 16);
          } else {
            cleanup();
          }
        });
    }
  }, []);

  const setContainer = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, []);

  // Alternative scroll preservation using element anchoring
  const preserveRelativeToElement = useCallback((elementId: string) => {
    try {
      const element = document.getElementById(elementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        
        scrollPositionRef.current = {
          x: window.scrollX,
          y: scrollY + rect.top, // Store absolute position of element
          timestamp: Date.now()
        };
        
        console.debug('Scroll position preserved relative to element:', elementId, scrollPositionRef.current);
      } else {
        // Fallback to regular preservation
        preserveScrollPosition();
      }
    } catch (error) {
      console.warn('Error preserving relative to element:', error);
      preserveScrollPosition();
    }
  }, [preserveScrollPosition]);

  const restoreRelativeToElement = useCallback((elementId: string) => {
    try {
      const element = document.getElementById(elementId);
      if (element && scrollPositionRef.current.timestamp > 0) {
        const rect = element.getBoundingClientRect();
        const currentScrollY = window.scrollY || document.documentElement.scrollTop;
        const elementCurrentAbsoluteY = currentScrollY + rect.top;
        
        // Calculate offset and restore
        const offset = scrollPositionRef.current.y - elementCurrentAbsoluteY;
        const targetScrollY = Math.max(0, currentScrollY + offset);
        
        window.scrollTo({
          left: scrollPositionRef.current.x,
          top: targetScrollY,
          behavior: 'instant'
        });
        
        console.debug('Scroll position restored relative to element:', elementId);
      } else {
        // Fallback to regular restoration
        restoreScrollPosition();
      }
    } catch (error) {
      console.warn('Error restoring relative to element:', error);
      restoreScrollPosition();
    }
  }, [restoreScrollPosition]);

  // Performance debugging helper (can be removed in production)
  const getPerformanceMetrics = useCallback(() => {
    return { ...performanceMetricsRef.current };
  }, []);

  return {
    preserveScrollPosition,
    restoreScrollPosition,
    preserveRelativeToElement,
    restoreRelativeToElement,
    setContainer,
    containerRef,
    getPerformanceMetrics
  };
}