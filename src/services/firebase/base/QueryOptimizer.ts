interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface QueryPerformanceMetrics {
  queryCount: number;
  cacheHits: number;
  cacheMisses: number;
  averageQueryTime: number;
  lastQueryTime: number;
}

/**
 * Optimizes Firebase queries through caching and performance monitoring
 * Reduces redundant network calls and improves app responsiveness
 */
export class QueryOptimizer {
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: QueryPerformanceMetrics = {
    queryCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageQueryTime: 0,
    lastQueryTime: 0
  };

  /**
   * Execute query with caching and performance tracking
   */
  async optimizedQuery<T>(
    cacheKey: string,
    queryFunction: () => Promise<T>,
    ttlMinutes: number = 5,
    forceRefresh: boolean = false
  ): Promise<T> {
    const startTime = Date.now();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getCachedResult<T>(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }
    }

    // Cache miss - execute actual query
    this.metrics.cacheMisses++;
    this.metrics.queryCount++;

    try {
      const result = await queryFunction();
      const queryTime = Date.now() - startTime;
      
      // Update performance metrics
      this.updateQueryMetrics(queryTime);
      
      // Store in cache
      this.setCachedResult(cacheKey, result, ttlMinutes);
      
      return result;
    } catch (error) {
      console.error('Query optimization error:', error);
      throw error;
    }
  }

  /**
   * Get cached result if valid
   */
  private getCachedResult<T>(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Store result in cache
   */
  private setCachedResult<T>(cacheKey: string, data: T, ttlMinutes: number): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  /**
   * Update query performance metrics
   */
  private updateQueryMetrics(queryTime: number): void {
    this.metrics.lastQueryTime = queryTime;
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.queryCount - 1) + queryTime) / this.metrics.queryCount;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Query cache cleared');
  }

  /**
   * Clear cached data matching pattern
   */
  clearCacheByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cleared ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalEntries: this.cache.size,
      ...this.metrics,
      cacheHitRatio: this.metrics.queryCount > 0 
        ? (this.metrics.cacheHits / this.metrics.queryCount * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get cache size in KB (approximate)
   */
  getCacheSizeKB(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Rough estimate: key + JSON data
      totalSize += key.length + JSON.stringify(entry.data).length;
    }
    
    return Math.round(totalSize / 1024 * 100) / 100;
  }

  /**
   * Pre-load data into cache
   */
  async preloadCache<T>(
    cacheKey: string,
    queryFunction: () => Promise<T>,
    ttlMinutes: number = 5
  ): Promise<void> {
    try {
      const result = await queryFunction();
      this.setCachedResult(cacheKey, result, ttlMinutes);
      console.log(`Preloaded cache for key: ${cacheKey}`);
    } catch (error) {
      console.error(`Failed to preload cache for key ${cacheKey}:`, error);
    }
  }

  /**
   * Batch preload multiple cache entries
   */
  async preloadBatch<T>(
    entries: Array<{
      key: string;
      queryFunction: () => Promise<T>;
      ttlMinutes?: number;
    }>
  ): Promise<void> {
    const promises = entries.map(entry => 
      this.preloadCache(entry.key, entry.queryFunction, entry.ttlMinutes || 5)
    );
    
    await Promise.all(promises);
    console.log(`Preloaded ${entries.length} cache entries`);
  }

  /**
   * Schedule automatic cache cleanup
   */
  scheduleCleanup(intervalMinutes: number = 30): () => void {
    const interval = setInterval(() => {
      this.clearExpiredCache();
    }, intervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageQueryTime: 0,
      lastQueryTime: 0
    };
    console.log('Query metrics reset');
  }
}

// Global query optimizer instance
export const globalQueryOptimizer = new QueryOptimizer();