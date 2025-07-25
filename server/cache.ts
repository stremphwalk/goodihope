// Simple in-memory cache for group dashboard data
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 30000; // 30 seconds default TTL

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Delete all cache entries matching a pattern
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Clean up expired entries (called periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const dashboardCache = new SimpleCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  dashboardCache.cleanup();
}, 5 * 60 * 1000);

// Cache key generators
export const CacheKeys = {
  groupDashboard: (groupId: number) => `dashboard:group:${groupId}`,
  groupMembers: (groupId: number) => `members:group:${groupId}`,
  groupTodos: (groupId: number) => `todos:group:${groupId}`,
  groupEvents: (groupId: number) => `events:group:${groupId}`,
};

// Cache invalidation helpers
export const CacheInvalidation = {
  // Invalidate all cache for a specific group
  invalidateGroup: (groupId: number) => {
    dashboardCache.deletePattern(`*:group:${groupId}*`);
  },
  
  // Invalidate dashboard data for a group
  invalidateDashboard: (groupId: number) => {
    dashboardCache.delete(CacheKeys.groupDashboard(groupId));
  },
  
  // Invalidate todos for a group
  invalidateTodos: (groupId: number) => {
    dashboardCache.delete(CacheKeys.groupTodos(groupId));
    dashboardCache.delete(CacheKeys.groupDashboard(groupId));
  },
  
  // Invalidate members for a group
  invalidateMembers: (groupId: number) => {
    dashboardCache.delete(CacheKeys.groupMembers(groupId));
    dashboardCache.delete(CacheKeys.groupDashboard(groupId));
  },
  
  // Invalidate events for a group
  invalidateEvents: (groupId: number) => {
    dashboardCache.delete(CacheKeys.groupEvents(groupId));
    dashboardCache.delete(CacheKeys.groupDashboard(groupId));
  }
};