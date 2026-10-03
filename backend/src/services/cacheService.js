// ============================================================================
// Departmental ERP - High-Performance In-Memory Cache Service
// Reduces cloud database latency by serving repeated reads instantly (1-2ms)
// Automatically invalidates upon write/mutation operations
// ============================================================================

class CacheService {
  constructor() {
    this.store = new Map();
    // Periodic garbage collection of expired entries every 60 seconds
    setInterval(() => this.cleanup(), 60000).unref();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds = 30) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  invalidatePattern(prefix) {
    for (const key of this.store.keys()) {
      if (key.includes(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Express Middleware for caching GET responses
   * @param {number} ttlSeconds - Time-to-live in seconds
   * @param {boolean} userSpecific - Whether cache key depends on logged-in user ID
   */
  middleware(ttlSeconds = 30, userSpecific = false) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Bypass cache if query param ?no-cache=true is provided
      if (req.query['no-cache'] === 'true') {
        return next();
      }

      const userPart = userSpecific ? (req.user?.id || 'anon') : (req.user?.role || 'all');
      const cacheKey = `${req.baseUrl}${req.path}:${JSON.stringify(req.query)}:${userPart}`;

      const cached = this.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }

      // Intercept res.json to capture response body
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful JSON responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(cacheKey, body, ttlSeconds);
          res.setHeader('X-Cache', 'MISS');
        }
        return originalJson(body);
      };

      next();
    };
  }

  /**
   * Middleware to auto-invalidate cache prefixes on mutations (POST, PUT, DELETE, PATCH)
   * @param {string[]} prefixes - Cache key patterns to invalidate
   */
  invalidateOnMutation(prefixes = []) {
    return (req, res, next) => {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        res.on('finish', () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            for (const p of prefixes) {
              this.invalidatePattern(p);
            }
          }
        });
      }
      next();
    };
  }
}

const cacheService = new CacheService();
module.exports = cacheService;
