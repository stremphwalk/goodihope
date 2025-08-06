/**
 * Transcription Authentication Middleware
 * Handles API key management and security for Soniox transcription
 */

import jwt from 'jsonwebtoken';
import { checkJwt } from '../auth.js';

// Rate limiting storage (in production, use Redis or similar)
// WARNING: Memory-based storage will reset on server restart and doesn't work with multiple instances
// For production, implement persistent storage using Redis, PostgreSQL, or similar
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute per user
const MAX_DAILY_REQUESTS = 1000; // 1000 requests per day per user

// Production rate limit implementation should use persistent storage:
// Example with Redis:
// const redis = require('redis');
// const client = redis.createClient(process.env.REDIS_URL);

/**
 * Rate limiting middleware for transcription requests
 * @param {string} userId - User identifier
 * @returns {boolean} Whether request is allowed
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userKey = `rate_${userId}`;
  const userDailyKey = `daily_${userId}`;
  
  // Get current rate limit data
  let userData = rateLimitStore.get(userKey) || { requests: [], dailyCount: 0, dailyReset: now + 24 * 60 * 60 * 1000 };
  
  // Reset daily count if needed
  if (now > userData.dailyReset) {
    userData.dailyCount = 0;
    userData.dailyReset = now + 24 * 60 * 60 * 1000;
  }
  
  // Check daily limit
  if (userData.dailyCount >= MAX_DAILY_REQUESTS) {
    return false;
  }
  
  // Clean old requests (older than window)
  userData.requests = userData.requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Check rate limit
  if (userData.requests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  // Add current request
  userData.requests.push(now);
  userData.dailyCount++;
  
  // Store updated data
  rateLimitStore.set(userKey, userData);
  
  return true;
}

/**
 * Generate secure token for Soniox API access
 * @param {string} userId - User identifier
 * @param {string} sessionId - Session identifier
 * @returns {string} JWT token
 */
function generateTranscriptionToken(userId, sessionId) {
  const payload = {
    userId,
    sessionId,
    service: 'soniox',
    timestamp: Date.now(),
    expiresIn: '1h'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-key', {
    expiresIn: '1h',
    issuer: 'arinote-transcription',
    audience: 'soniox-client'
  });
}

/**
 * Verify transcription token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
function verifyTranscriptionToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-key', {
      issuer: 'arinote-transcription',
      audience: 'soniox-client'
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Middleware to authenticate transcription requests
 */
export const authenticateTranscription = async (req, res, next) => {
  try {
    // Check if user is authenticated via existing auth system
    const authResult = await checkJwt(req, res, () => {});
    
    if (!req.auth || !req.auth.sub) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userId = req.auth.sub;
    
    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
      });
    }
    
    // Add user info to request
    req.transcriptionUser = {
      id: userId,
      rateLimitRemaining: MAX_REQUESTS_PER_WINDOW - (rateLimitStore.get(`rate_${userId}`)?.requests.length || 0),
      dailyLimitRemaining: MAX_DAILY_REQUESTS - (rateLimitStore.get(`rate_${userId}`)?.dailyCount || 0)
    };
    
    next();
  } catch (error) {
    console.error('Transcription authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to validate transcription session
 */
export const validateTranscriptionSession = (req, res, next) => {
  const { sessionId } = req.body;
  
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      error: 'Valid session ID required',
      code: 'INVALID_SESSION'
    });
  }
  
  // Additional session validation could go here
  // e.g., check if session exists in database, is not expired, etc.
  
  req.sessionId = sessionId;
  next();
};

/**
 * Get Soniox API key from environment
 * @returns {string|null} API key or null if not available
 */
export function getSonioxApiKey() {
  return process.env.SONIOX_API_KEY || null;
}

/**
 * Validate Soniox API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether API key appears valid
 */
export function validateSonioxApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Basic format validation
  // Soniox API keys typically have a specific format
  return apiKey.length > 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
}

/**
 * Security headers middleware for transcription endpoints
 */
export const addTranscriptionSecurityHeaders = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS headers for transcription (if needed)
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
};

/**
 * Log transcription usage for monitoring
 */
export const logTranscriptionUsage = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to log on response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - startTime;
    const userId = req.transcriptionUser?.id || 'unknown';
    const sessionId = req.sessionId || 'unknown';
    
    // Log usage (in production, send to monitoring service)
    console.log(`Transcription usage: ${userId} - ${sessionId} - ${duration}ms - ${res.statusCode}`);
    
    // Could store in database for analytics
    // await storeTranscriptionUsage({ userId, sessionId, duration, statusCode: res.statusCode });
    
    return originalJson.call(this, body);
  };
  
  next();
};

export { generateTranscriptionToken, verifyTranscriptionToken };