import { Request, Response, NextFunction } from 'express';

// Security configuration
export const SECURITY_CONFIG = {
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    MAX_IMAGE_REQUESTS: 10, // Stricter limit for image processing
  },
  VALIDATION: {
    MAX_STRING_LENGTH: 100,
    MAX_MEDICATION_NAME_LENGTH: 100,
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    MIN_QUERY_LENGTH: 2,
  },
  CORS: {
    PRODUCTION_ORIGINS: ['https://yourdomain.com'], // Replace with actual domain
    DEVELOPMENT_ORIGINS: ['http://localhost:3000', 'http://localhost:5173'],
  }
};

// Enhanced rate limiting middleware
export function createRateLimiter(maxRequests: number = SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
  const rateLimitMap = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS;
    
    if (!rateLimitMap.has(clientIP)) {
      rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const clientData = rateLimitMap.get(clientIP);
    
    if (now > clientData.resetTime) {
      rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    next();
  };
}

// Input sanitization utilities
export function sanitizeString(input: any, maxLength: number = SECURITY_CONFIG.VALIDATION.MAX_STRING_LENGTH): string | null {
  if (typeof input !== 'string' || input.length === 0 || input.length > maxLength) {
    return null;
  }
  
  // Remove potentially harmful characters and normalize whitespace
  return input
    .replace(/[<>\"'&\x00-\x1f\x7f-\x9f]/g, '') // Remove control chars and HTML chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function validateBase64Image(input: any): { data: string; type: string } | null {
  if (typeof input !== 'string') return null;
  
  let base64Data = input;
  let imageType = 'image/jpeg';
  
  // Handle data URL format
  if (input.startsWith('data:image/')) {
    const matches = input.match(/^data:(image\/(?:jpeg|jpg|png|gif|webp));base64,(.+)$/i);
    if (!matches) return null;
    
    imageType = matches[1].toLowerCase();
    base64Data = matches[2];
  }
  
  // Validate base64 format
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Data)) return null;
  
  // Check size (base64 is ~4/3 the size of original)
  const estimatedSize = (base64Data.length * 3) / 4;
  if (estimatedSize > SECURITY_CONFIG.VALIDATION.MAX_IMAGE_SIZE) return null;
  
  return { data: base64Data, type: imageType };
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self';"
    );
  }
  
  next();
}

// CORS middleware
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? SECURITY_CONFIG.CORS.PRODUCTION_ORIGINS
    : SECURITY_CONFIG.CORS.DEVELOPMENT_ORIGINS;
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}

// Error handling middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log error details for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  const status = err.status || err.statusCode || 500;
  
  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? (status === 500 ? 'Internal Server Error' : err.message)
    : err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
  
  // Don't throw in production to prevent crashes
  if (process.env.NODE_ENV !== 'production') {
    throw err;
  }
}