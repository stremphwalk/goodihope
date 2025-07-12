/**
 * Intelligent Cache System for AriNote Companion
 * Provides memory-efficient caching with automatic cleanup and TTL
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  accessCount: number
  lastAccessed: number
  ttl: number
}

interface CacheStats {
  totalEntries: number
  hitRate: number
  memoryUsage: number
  oldestEntry: number
  newestEntry: number
}

export class IntelligentCache<K extends string | number, V> {
  private cache = new Map<K, CacheEntry<V>>()
  private maxSize: number
  private defaultTTL: number
  private cleanupInterval: NodeJS.Timeout | null = null
  private hits = 0
  private misses = 0
  
  // Performance thresholds
  private readonly CLEANUP_INTERVAL = 60000 // 1 minute
  private readonly MAX_MEMORY_ENTRIES = 1000
  private readonly LRU_CLEANUP_RATIO = 0.3 // Remove 30% when full

  constructor(maxSize = 500, defaultTTL = 300000) { // 5 minutes default TTL
    this.maxSize = Math.min(maxSize, this.MAX_MEMORY_ENTRIES)
    this.defaultTTL = defaultTTL
    this.initializeCleanup()
  }

  private initializeCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, this.CLEANUP_INTERVAL)
  }

  private performCleanup() {
    const now = Date.now()
    const entriesToRemove: K[] = []

    // Remove expired entries
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        entriesToRemove.push(key)
      }
    }

    // Remove expired entries
    entriesToRemove.forEach(key => this.cache.delete(key))

    // If still over capacity, remove least recently used
    if (this.cache.size > this.maxSize) {
      this.performLRUCleanup()
    }

    // Log cleanup stats
    if (entriesToRemove.length > 0) {
      console.log(`Cache cleanup: removed ${entriesToRemove.length} expired entries`)
    }
  }

  private performLRUCleanup() {
    const entries = Array.from(this.cache.entries())
    
    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
    
    // Remove the oldest 30% of entries
    const removeCount = Math.floor(entries.length * this.LRU_CLEANUP_RATIO)
    for (let i = 0; i < removeCount; i++) {
      const [key] = entries[i]
      this.cache.delete(key)
    }

    console.log(`LRU cleanup: removed ${removeCount} least recently used entries`)
  }

  set(key: K, value: V, ttl?: number): void {
    const now = Date.now()
    const entry: CacheEntry<V> = {
      data: value,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
      ttl: ttl || this.defaultTTL
    }

    this.cache.set(key, entry)

    // Immediate cleanup if over capacity
    if (this.cache.size > this.maxSize) {
      this.performLRUCleanup()
    }
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.misses++
      return undefined
    }

    const now = Date.now()
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.misses++
      return undefined
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now
    this.hits++

    return entry.data
  }

  has(key: K): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check expiration
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  // Advanced cache operations
  prefetch(key: K, valueProvider: () => Promise<V>, ttl?: number): Promise<V> {
    return new Promise(async (resolve, reject) => {
      const cached = this.get(key)
      if (cached !== undefined) {
        resolve(cached)
        return
      }

      try {
        const value = await valueProvider()
        this.set(key, value, ttl)
        resolve(value)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Get cache statistics
  getStats(): CacheStats {
    const now = Date.now()
    let oldest = now
    let newest = 0
    let memoryUsage = 0

    for (const entry of this.cache.values()) {
      oldest = Math.min(oldest, entry.timestamp)
      newest = Math.max(newest, entry.timestamp)
      
      // Rough memory estimation
      memoryUsage += JSON.stringify(entry.data).length
    }

    const totalRequests = this.hits + this.misses
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0

    return {
      totalEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: Math.round(memoryUsage / 1024), // KB
      oldestEntry: oldest,
      newestEntry: newest
    }
  }

  // Optimize cache by removing least accessed items
  optimize(): void {
    if (this.cache.size < this.maxSize * 0.8) return

    const entries = Array.from(this.cache.entries())
    
    // Sort by access count and recency (least accessed + oldest first)
    entries.sort(([, a], [, b]) => {
      const scoreA = a.accessCount * (Date.now() - a.lastAccessed)
      const scoreB = b.accessCount * (Date.now() - b.lastAccessed)
      return scoreB - scoreA // Higher score = keep (more accessed + more recent)
    })

    // Remove bottom 20%
    const removeCount = Math.floor(entries.length * 0.2)
    for (let i = entries.length - removeCount; i < entries.length; i++) {
      const [key] = entries[i]
      this.cache.delete(key)
    }

    console.log(`Cache optimization: removed ${removeCount} underused entries`)
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Specialized cache instances for different data types
export const phraseCache = new IntelligentCache<string, any>(200, 600000) // 10 minute TTL for phrases
export const apiResponseCache = new IntelligentCache<string, any>(100, 300000) // 5 minute TTL for API responses  
export const userDataCache = new IntelligentCache<string, any>(50, 1800000) // 30 minute TTL for user data

// Global cache manager
class CacheManager {
  private caches = [phraseCache, apiResponseCache, userDataCache]

  getGlobalStats() {
    return this.caches.map(cache => cache.getStats())
  }

  optimizeAll() {
    this.caches.forEach(cache => cache.optimize())
  }

  clearAll() {
    this.caches.forEach(cache => cache.clear())
  }

  destroyAll() {
    this.caches.forEach(cache => cache.destroy())
  }
}

export const cacheManager = new CacheManager()