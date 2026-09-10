/**
 * Simple Memory-Based Rate Limiting
 * 
 * IMPORTANT: This is a simple in-memory implementation
 * For production with multiple servers, use Redis-based rate limiting
 * (e.g., @upstash/ratelimit)
 * 
 * This implementation:
 * - Works for single-server deployments
 * - Resets on server restart
 * - Good enough for MVP/staging
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Store rate limit data in memory
const globalRequests = new Map<string, RateLimitRecord>();
const loginAttempts = new Map<string, RateLimitRecord>();
const apiRequests = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  
  for (const [key, value] of globalRequests.entries()) {
    if (now > value.resetAt) {
      globalRequests.delete(key);
    }
  }
  
  for (const [key, value] of loginAttempts.entries()) {
    if (now > value.resetAt) {
      loginAttempts.delete(key);
    }
  }
  
  for (const [key, value] of apiRequests.entries()) {
    if (now > value.resetAt) {
      apiRequests.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(
  store: Map<string, RateLimitRecord>,
  identifier: string,
  limit: number,
  windowMs: number
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetAt) {
    // Create new record
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetAt,
  };
}

/**
 * Global rate limit: 100 requests per minute
 * Applies to all authenticated requests
 */
export function globalRateLimit(identifier: string) {
  return checkRateLimit(globalRequests, identifier, 100, 60 * 1000);
}

/**
 * Login rate limit: 5 attempts per 15 minutes
 * Prevents brute force attacks
 */
export function loginRateLimit(identifier: string) {
  return checkRateLimit(loginAttempts, identifier, 5, 15 * 60 * 1000);
}

/**
 * API rate limit: 50 requests per minute per user
 * Prevents API abuse
 */
export function apiRateLimit(identifier: string) {
  return checkRateLimit(apiRequests, identifier, 50, 60 * 1000);
}

/**
 * Get rate limit stats for monitoring
 */
export function getRateLimitStats() {
  return {
    global: {
      activeUsers: globalRequests.size,
    },
    login: {
      blockedIPs: loginAttempts.size,
    },
    api: {
      activeUsers: apiRequests.size,
    },
  };
}

/**
 * Clear rate limits for an identifier (admin function)
 */
export function clearRateLimit(identifier: string) {
  globalRequests.delete(identifier);
  loginAttempts.delete(identifier);
  apiRequests.delete(identifier);
}
