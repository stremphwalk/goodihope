/**
 * Performance Manager for AriNote Companion
 * Handles memory optimization, resource cleanup, and performance monitoring
 */

interface PerformanceMetrics {
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: number
  activeListeners: number
  openWindows: number
  cacheSize: number
  lastGC: number
}

class PerformanceManager {
  private metrics: PerformanceMetrics = {
    memoryUsage: process.memoryUsage(),
    cpuUsage: 0,
    activeListeners: 0,
    openWindows: 0,
    cacheSize: 0,
    lastGC: Date.now()
  }
  
  private gcInterval: NodeJS.Timeout | null = null
  private metricsInterval: NodeJS.Timeout | null = null
  private cleanupCallbacks: Set<() => void> = new Set()
  
  // Memory thresholds (in MB)
  private readonly MEMORY_WARNING_THRESHOLD = 100
  private readonly MEMORY_CRITICAL_THRESHOLD = 200
  private readonly GC_INTERVAL = 30000 // 30 seconds
  
  constructor() {
    this.initializeMonitoring()
  }

  private initializeMonitoring() {
    // Periodic garbage collection for memory optimization
    this.gcInterval = setInterval(() => {
      this.performGarbageCollection()
    }, this.GC_INTERVAL)

    // Metrics collection every 10 seconds
    this.metricsInterval = setInterval(() => {
      this.updateMetrics()
    }, 10000)

    // Listen for memory pressure events
    process.on('memoryUsage', this.handleMemoryPressure.bind(this))
  }

  private performGarbageCollection() {
    if (global.gc) {
      const beforeMemory = process.memoryUsage()
      global.gc()
      const afterMemory = process.memoryUsage()
      
      const freedMemory = beforeMemory.heapUsed - afterMemory.heapUsed
      console.log(`GC freed ${(freedMemory / 1024 / 1024).toFixed(2)} MB`)
      
      this.metrics.lastGC = Date.now()
    }
  }

  private updateMetrics() {
    this.metrics.memoryUsage = process.memoryUsage()
    
    const heapUsedMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024
    
    if (heapUsedMB > this.MEMORY_CRITICAL_THRESHOLD) {
      this.handleCriticalMemoryUsage()
    } else if (heapUsedMB > this.MEMORY_WARNING_THRESHOLD) {
      this.handleHighMemoryUsage()
    }
  }

  private handleMemoryPressure() {
    console.warn('Memory pressure detected, performing cleanup...')
    this.performEmergencyCleanup()
  }

  private handleHighMemoryUsage() {
    console.warn(`High memory usage: ${(this.metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`)
    this.performGarbageCollection()
  }

  private handleCriticalMemoryUsage() {
    console.error(`Critical memory usage: ${(this.metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`)
    this.performEmergencyCleanup()
  }

  private performEmergencyCleanup() {
    // Execute all registered cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Cleanup callback failed:', error)
      }
    })

    // Force garbage collection
    this.performGarbageCollection()
  }

  // Public API
  registerCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback)
    return () => this.cleanupCallbacks.delete(callback)
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  optimizeMemory(): void {
    this.performGarbageCollection()
  }

  destroy() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval)
      this.gcInterval = null
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
    
    this.cleanupCallbacks.clear()
  }
}

// Singleton instance
export const performanceManager = new PerformanceManager()

// Memory-efficient WeakMap cache for temporary data
export class EfficientCache<K extends object, V> {
  private cache = new WeakMap<K, V>()
  private size = 0
  private maxSize: number

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
  }

  set(key: K, value: V): void {
    if (!this.cache.has(key)) {
      this.size++
    }
    this.cache.set(key, value)
    
    if (this.size > this.maxSize) {
      // WeakMap will automatically clean up unreferenced keys
      this.size = Math.floor(this.maxSize * 0.8) // Estimate cleanup
    }
  }

  get(key: K): V | undefined {
    return this.cache.get(key)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  getSize(): number {
    return this.size
  }
}

// Debounced function utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null

  const debounced = function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }

    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(this, args)
  } as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}

// Throttle function for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  } as T
}