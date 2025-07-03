/**
 * Rate Limiting Middleware
 * Implements tiered rate limiting with sliding windows and Redis integration
 */

import Redis from 'ioredis';
import crypto from 'crypto';

class RateLimiter {
  constructor(redisConfig = {}) {
    this.redis = new Redis(redisConfig);
    this.tiers = {
      free: {
        requests: 100,
        window: 15 * 60, // 15 minutes
        files: 10,
        fileWindow: 24 * 60 * 60 // 24 hours
      },
      pro: {
        requests: 1000,
        window: 15 * 60,
        files: 100,
        fileWindow: 24 * 60 * 60
      },
      enterprise: {
        requests: 10000,
        window: 15 * 60,
        files: 1000,
        fileWindow: 24 * 60 * 60
      }
    };
  }

  /**
   * Get user tier (defaults to free)
   */
  async getUserTier(userId) {
    if (!userId) return 'free';
    
    try {
      const tier = await this.redis.get(`user:${userId}:tier`);
      return tier || 'free';
    } catch (error) {
      console.error('Error getting user tier:', error);
      return 'free';
    }
  }

  /**
   * Set user tier
   */
  async setUserTier(userId, tier) {
    if (!this.tiers[tier]) {
      throw new Error(`Invalid tier: ${tier}`);
    }
    
    await this.redis.set(`user:${userId}:tier`, tier);
  }

  /**
   * Get rate limit info for a key
   */
  async getRateLimitInfo(key, window) {
    const now = Date.now();
    const windowStart = now - (window * 1000);
    
    // Get all requests in the current window
    const requests = await this.redis.zrangebyscore(
      key,
      windowStart,
      '+inf'
    );
    
    return {
      count: requests.length,
      reset: now + (window * 1000),
      window
    };
  }

  /**
   * Check if request is allowed
   */
  async isAllowed(key, limit, window) {
    const info = await this.getRateLimitInfo(key, window);
    return info.count < limit;
  }

  /**
   * Record a request
   */
  async recordRequest(key, window) {
    const now = Date.now();
    const windowStart = now - (window * 1000);
    
    // Add current request
    await this.redis.zadd(key, now, now.toString());
    
    // Remove old requests outside the window
    await this.redis.zremrangebyscore(key, '-inf', windowStart);
    
    // Set expiry on the key
    await this.redis.expire(key, window);
  }

  /**
   * Get remaining requests
   */
  async getRemaining(key, limit, window) {
    const info = await this.getRateLimitInfo(key, window);
    return Math.max(0, limit - info.count);
  }

  /**
   * Generate rate limit key
   */
  generateKey(type, identifier) {
    return `rate_limit:${type}:${identifier}`;
  }

  /**
   * Get client identifier (IP or user ID)
   */
  getClientIdentifier(req) {
    // Prefer user ID if authenticated
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    
    // Fall back to IP address
    return `ip:${req.ip || req.connection.remoteAddress}`;
  }

  /**
   * Main rate limiting middleware
   */
  middleware() {
    return async (req, res, next) => {
      try {
        const clientId = this.getClientIdentifier(req);
        const userTier = await this.getUserTier(req.user?.id);
        const tierConfig = this.tiers[userTier];
        
        // Check API request limits
        const apiKey = this.generateKey('api', clientId);
        const isApiAllowed = await this.isAllowed(
          apiKey,
          tierConfig.requests,
          tierConfig.window
        );
        
        if (!isApiAllowed) {
          const remaining = await this.getRemaining(apiKey, tierConfig.requests, tierConfig.window);
          const reset = await this.getRateLimitInfo(apiKey, tierConfig.window);
          
          res.set({
            'X-RateLimit-Limit': tierConfig.requests,
            'X-RateLimit-Remaining': remaining,
            'X-RateLimit-Reset': reset.reset,
            'Retry-After': Math.ceil(tierConfig.window / 60)
          });
          
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              limit: tierConfig.requests,
              remaining,
              reset: reset.reset,
              retryAfter: Math.ceil(tierConfig.window / 60)
            }
          });
        }
        
        // Record the request
        await this.recordRequest(apiKey, tierConfig.window);
        
        // Set rate limit headers
        const remaining = await this.getRemaining(apiKey, tierConfig.requests, tierConfig.window);
        const reset = await this.getRateLimitInfo(apiKey, tierConfig.window);
        
        res.set({
          'X-RateLimit-Limit': tierConfig.requests,
          'X-RateLimit-Remaining': remaining,
          'X-RateLimit-Reset': reset.reset
        });
        
        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Allow request to proceed if rate limiting fails
        next();
      }
    };
  }

  /**
   * File upload rate limiting middleware
   */
  fileUploadMiddleware() {
    return async (req, res, next) => {
      try {
        const clientId = this.getClientIdentifier(req);
        const userTier = await this.getUserTier(req.user?.id);
        const tierConfig = this.tiers[userTier];
        
        // Check file upload limits
        const fileKey = this.generateKey('files', clientId);
        const isFileAllowed = await this.isAllowed(
          fileKey,
          tierConfig.files,
          tierConfig.fileWindow
        );
        
        if (!isFileAllowed) {
          const remaining = await this.getRemaining(fileKey, tierConfig.files, tierConfig.fileWindow);
          const reset = await this.getRateLimitInfo(fileKey, tierConfig.fileWindow);
          
          return res.status(429).json({
            success: false,
            error: 'File upload limit exceeded',
            code: 'FILE_LIMIT_EXCEEDED',
            details: {
              limit: tierConfig.files,
              remaining,
              reset: reset.reset,
              window: '24 hours'
            }
          });
        }
        
        // Record the file upload
        await this.recordRequest(fileKey, tierConfig.fileWindow);
        
        next();
      } catch (error) {
        console.error('File upload rate limiting error:', error);
        next();
      }
    };
  }

  /**
   * Webhook rate limiting middleware
   */
  webhookMiddleware() {
    return async (req, res, next) => {
      try {
        const clientId = this.getClientIdentifier(req);
        const webhookKey = this.generateKey('webhook', clientId);
        
        // Webhook limits: 100 requests per hour
        const isAllowed = await this.isAllowed(webhookKey, 100, 60 * 60);
        
        if (!isAllowed) {
          const remaining = await this.getRemaining(webhookKey, 100, 60 * 60);
          const reset = await this.getRateLimitInfo(webhookKey, 60 * 60);
          
          return res.status(429).json({
            success: false,
            error: 'Webhook rate limit exceeded',
            code: 'WEBHOOK_LIMIT_EXCEEDED',
            details: {
              limit: 100,
              remaining,
              reset: reset.reset,
              window: '1 hour'
            }
          });
        }
        
        await this.recordRequest(webhookKey, 60 * 60);
        next();
      } catch (error) {
        console.error('Webhook rate limiting error:', error);
        next();
      }
    };
  }

  /**
   * Admin rate limiting middleware (higher limits)
   */
  adminMiddleware() {
    return async (req, res, next) => {
      try {
        // Check if user is admin
        if (!req.user || req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Admin access required',
            code: 'ADMIN_ACCESS_REQUIRED'
          });
        }
        
        const clientId = this.getClientIdentifier(req);
        const adminKey = this.generateKey('admin', clientId);
        
        // Admin limits: 1000 requests per 15 minutes
        const isAllowed = await this.isAllowed(adminKey, 1000, 15 * 60);
        
        if (!isAllowed) {
          const remaining = await this.getRemaining(adminKey, 1000, 15 * 60);
          const reset = await this.getRateLimitInfo(adminKey, 15 * 60);
          
          return res.status(429).json({
            success: false,
            error: 'Admin rate limit exceeded',
            code: 'ADMIN_LIMIT_EXCEEDED',
            details: {
              limit: 1000,
              remaining,
              reset: reset.reset
            }
          });
        }
        
        await this.recordRequest(adminKey, 15 * 60);
        next();
      } catch (error) {
        console.error('Admin rate limiting error:', error);
        next();
      }
    };
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsage(userId) {
    try {
      const userTier = await this.getUserTier(userId);
      const tierConfig = this.tiers[userTier];
      
      const apiKey = this.generateKey('api', `user:${userId}`);
      const fileKey = this.generateKey('files', `user:${userId}`);
      
      const apiUsage = await this.getRateLimitInfo(apiKey, tierConfig.window);
      const fileUsage = await this.getRateLimitInfo(fileKey, tierConfig.fileWindow);
      
      return {
        tier: userTier,
        api: {
          used: apiUsage.count,
          limit: tierConfig.requests,
          remaining: Math.max(0, tierConfig.requests - apiUsage.count),
          reset: apiUsage.reset
        },
        files: {
          used: fileUsage.count,
          limit: tierConfig.files,
          remaining: Math.max(0, tierConfig.files - fileUsage.count),
          reset: fileUsage.reset
        }
      };
    } catch (error) {
      console.error('Error getting user usage:', error);
      return null;
    }
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetUserLimits(userId) {
    try {
      const apiKey = this.generateKey('api', `user:${userId}`);
      const fileKey = this.generateKey('files', `user:${userId}`);
      
      await this.redis.del(apiKey, fileKey);
      
      return { success: true };
    } catch (error) {
      console.error('Error resetting user limits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get global rate limiting statistics
   */
  async getGlobalStats() {
    try {
      const keys = await this.redis.keys('rate_limit:*');
      const stats = {
        totalKeys: keys.length,
        byType: {},
        byTier: {}
      };
      
      for (const key of keys) {
        const parts = key.split(':');
        const type = parts[2];
        const identifier = parts[3];
        
        if (!stats.byType[type]) {
          stats.byType[type] = 0;
        }
        stats.byType[type]++;
        
        if (identifier.startsWith('user:')) {
          const userId = identifier.split(':')[1];
          const tier = await this.getUserTier(userId);
          
          if (!stats.byTier[tier]) {
            stats.byTier[tier] = 0;
          }
          stats.byTier[tier]++;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting global stats:', error);
      return null;
    }
  }

  /**
   * Clean up expired rate limit keys
   */
  async cleanup() {
    try {
      const keys = await this.redis.keys('rate_limit:*');
      let cleaned = 0;
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiry set
          await this.redis.expire(key, 3600); // Set 1 hour expiry
          cleaned++;
        }
      }
      
      return { cleaned };
    } catch (error) {
      console.error('Error cleaning up rate limits:', error);
      return { cleaned: 0, error: error.message };
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export class for testing
export { RateLimiter }; 