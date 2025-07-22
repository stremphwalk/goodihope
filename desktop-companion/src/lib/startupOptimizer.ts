/**
 * Startup Optimizer for AriNote Companion
 * Optimizes application boot time and initial loading performance
 */

import React from 'react';

interface StartupMetrics {
  startTime: number
  authTime?: number
  componentsLoadTime?: number
  apiReadyTime?: number
  totalBootTime?: number
}

class StartupOptimizer {
  private metrics: StartupMetrics = {
    startTime: Date.now()
  }
  
  private initializationQueue: Array<{
    name: string
    priority: number
    initFn: () => Promise<void> | void
  }> = []
  
  private isInitialized = false
  private criticalResourcesLoaded = false

  constructor() {
    this.optimizeInitialLoad()
  }

  private optimizeInitialLoad() {
    // Defer non-critical initializations
    requestIdleCallback(() => {
      this.initializeNonCriticalResources()
    })

    // Preload critical resources
    this.preloadCriticalResources()
  }

  private async preloadCriticalResources() {
    const startTime = Date.now()
    
    try {
      // Preload authentication state
      await this.preloadAuthState()
      
      // Preload built-in phrases (lightweight)
      this.preloadBuiltInPhrases()
      
      
      
      this.criticalResourcesLoaded = true
      console.log(`Critical resources loaded in ${Date.now() - startTime}ms`)
      
    } catch (error) {
      console.error('Failed to preload critical resources:', error)
    }
  }

  private async preloadAuthState() {
    // Check for existing auth tokens in localStorage
    const startTime = Date.now()
    
    try {
      const authState = localStorage.getItem('amplify-authenticator-authState')
      if (authState) {
        // Pre-validate token without blocking UI
        setTimeout(() => this.validateAuthToken(), 100)
      }
      
      this.metrics.authTime = Date.now() - startTime
    } catch (error) {
      console.warn('Auth state preload failed:', error)
    }
  }

  private preloadBuiltInPhrases() {
    // Built-in phrases are already in memory, just mark as ready
    const builtInPhrasesReady = true
    if (builtInPhrasesReady) {
      this.markComponentReady('built-in-phrases')
    }
  }

  private async validateAuthToken() {
    // Validate auth token in background
    try {
      const amplifyAuth = await import('aws-amplify/auth')
      await amplifyAuth.getCurrentUser()
    } catch (error) {
      // Token invalid or expired, user will need to re-authenticate
      console.log('Auth token validation failed, will require sign-in')
    }
  }

  private async initializeNonCriticalResources() {
    // Sort by priority (higher number = higher priority)
    this.initializationQueue.sort((a, b) => b.priority - a.priority)
    
    // Initialize in batches to prevent blocking
    const batchSize = 3
    for (let i = 0; i < this.initializationQueue.length; i += batchSize) {
      const batch = this.initializationQueue.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async ({ name, initFn }) => {
          try {
            await initFn()
            console.log(`Initialized ${name}`)
          } catch (error) {
            console.error(`Failed to initialize ${name}:`, error)
          }
        })
      )
      
      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    this.isInitialized = true
    this.metrics.totalBootTime = Date.now() - this.metrics.startTime
    console.log(`Total boot time: ${this.metrics.totalBootTime}ms`)
  }

  // Public API
  addInitializer(name: string, initFn: () => Promise<void> | void, priority = 1) {
    if (this.isInitialized) {
      // Already initialized, run immediately
      setTimeout(() => initFn(), 0)
      return
    }
    
    this.initializationQueue.push({
      name,
      priority,
      initFn
    })
  }

  markComponentReady(componentName: string) {
    const now = Date.now()
    
    switch (componentName) {
      case 'auth':
        this.metrics.authTime = now - this.metrics.startTime
        break
      case 'components':
        this.metrics.componentsLoadTime = now - this.metrics.startTime
        break
      case 'api':
        this.metrics.apiReadyTime = now - this.metrics.startTime
        break
    }
  }

  getMetrics(): StartupMetrics {
    return { ...this.metrics }
  }

  // Lazy loading utilities
  createLazyComponent<T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T }>) {
    return React.lazy(() => 
      importFn().catch(error => {
        console.error('Lazy component loading failed:', error)
        const Fallback = () => React.createElement('div', null, 'Component failed to load');
        return { default: Fallback as unknown as T };
      })
    )
  }

  // Resource preloading
  preloadResource(url: string, type: 'script' | 'style' | 'fetch' = 'fetch'): Promise<void> {
    return new Promise((resolve, reject) => {
      switch (type) {
        case 'script':
          const script = document.createElement('script')
          script.src = url
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
          break
          
        case 'style':
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = url
          link.onload = () => resolve()
          link.onerror = reject
          document.head.appendChild(link)
          break
          
        case 'fetch':
        default:
          fetch(url)
            .then(() => resolve())
            .catch(reject)
          break
      }
    })
  }

  // Critical resource loading check
  waitForCriticalResources(): Promise<void> {
    return new Promise((resolve) => {
      if (this.criticalResourcesLoaded) {
        resolve()
        return
      }
      
      const checkInterval = setInterval(() => {
        if (this.criticalResourcesLoaded) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        console.warn('Critical resources loading timeout')
        resolve()
      }, 5000)
    })
  }
}

// Export singleton
export const startupOptimizer = new StartupOptimizer()

// Utility for measuring component render time
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    React.useEffect(() => {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        console.log(`${componentName} render time: ${endTime - startTime}ms`)
      }
    }, [])
    
    return React.createElement(WrappedComponent, props)
  })
}

// Utility for deferring expensive operations
export function deferExpensiveOperation<T>(
  operation: () => T,
  delay = 100
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(operation())
    }, delay)
  })
}