/**
 * Transcription API Routes
 * Handles Soniox API key management, token generation, and transcription endpoints
 */

import express from 'express';
import {
  authenticateTranscription,
  validateTranscriptionSession,
  addTranscriptionSecurityHeaders,
  logTranscriptionUsage,
  generateTranscriptionToken,
  verifyTranscriptionToken,
  getSonioxApiKey,
  validateSonioxApiKey
} from '../middleware/transcriptionAuth.js';

const router = express.Router();

// Apply security headers to all transcription routes
router.use(addTranscriptionSecurityHeaders);

/**
 * POST /api/transcription/token
 * Generate a secure token for client-side Soniox access
 */
router.post('/token', 
  authenticateTranscription,
  validateTranscriptionSession,
  logTranscriptionUsage,
  async (req, res) => {
    try {
      const { sessionId } = req;
      const userId = req.transcriptionUser.id;
      
      // Get Soniox API key
      const sonioxApiKey = getSonioxApiKey();
      if (!sonioxApiKey) {
        return res.status(503).json({
          error: 'Transcription service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE'
        });
      }
      
      if (!validateSonioxApiKey(sonioxApiKey)) {
        console.error('Invalid Soniox API key configuration');
        return res.status(503).json({
          error: 'Transcription service configuration error',
          code: 'CONFIG_ERROR'
        });
      }
      
      // Generate secure token
      const token = generateTranscriptionToken(userId, sessionId);
      
      res.json({
        token: sonioxApiKey, // In production, you might want to use a proxy token
        sessionId,
        expiresIn: 3600, // 1 hour
        rateLimitRemaining: req.transcriptionUser.rateLimitRemaining,
        dailyLimitRemaining: req.transcriptionUser.dailyLimitRemaining,
        config: {
          maxDuration: 30000, // 30 seconds
          model: 'stt-rt-preview',
          supportedLanguages: ['en', 'fr']
        }
      });
      
    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({
        error: 'Failed to generate transcription token',
        code: 'TOKEN_GENERATION_FAILED'
      });
    }
  }
);

/**
 * POST /api/transcription/verify
 * Verify a transcription token
 */
router.post('/verify',
  async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          error: 'Token required',
          code: 'TOKEN_REQUIRED'
        });
      }
      
      const payload = verifyTranscriptionToken(token);
      if (!payload) {
        return res.status(401).json({
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }
      
      res.json({
        valid: true,
        userId: payload.userId,
        sessionId: payload.sessionId,
        expiresAt: payload.exp * 1000 // Convert to milliseconds
      });
      
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        error: 'Token verification failed',
        code: 'VERIFICATION_FAILED'
      });
    }
  }
);

/**
 * GET /api/transcription/config
 * Get transcription configuration and supported features
 */
router.get('/config',
  authenticateTranscription,
  (req, res) => {
    try {
      res.json({
        supportedLanguages: [
          { code: 'en', name: 'English', medicalTerms: true },
          { code: 'fr', name: 'Français', medicalTerms: true }
        ],
        models: [
          { id: 'stt-rt-preview', name: 'Real-time Preview', description: 'Optimized for medical transcription' }
        ],
        features: {
          realTime: true,
          languageDetection: true,
          medicalOptimization: true,
          confidenceScoring: true,
          voiceActivityDetection: true,
          customVocabulary: true
        },
        limits: {
          maxDuration: 30000, // 30 seconds per session
          maxRequestsPerMinute: 30,
          maxRequestsPerDay: 1000,
          maxConcurrentSessions: 3
        },
        rateLimitRemaining: req.transcriptionUser.rateLimitRemaining,
        dailyLimitRemaining: req.transcriptionUser.dailyLimitRemaining
      });
      
    } catch (error) {
      console.error('Config retrieval error:', error);
      res.status(500).json({
        error: 'Failed to get configuration',
        code: 'CONFIG_ERROR'
      });
    }
  }
);

/**
 * POST /api/transcription/usage
 * Log transcription usage and analytics
 */
router.post('/usage',
  authenticateTranscription,
  validateTranscriptionSession,
  async (req, res) => {
    try {
      const { sessionId } = req;
      const userId = req.transcriptionUser.id;
      const {
        duration,
        confidence,
        language,
        section,
        wordsTranscribed,
        errorOccurred,
        errorType
      } = req.body;
      
      // In production, store this in a proper analytics database
      const usageData = {
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        duration: parseInt(duration) || 0,
        confidence: parseFloat(confidence) || 0,
        language: language || 'en',
        section: section || 'general',
        wordsTranscribed: parseInt(wordsTranscribed) || 0,
        errorOccurred: Boolean(errorOccurred),
        errorType: errorType || null
      };
      
      console.log('Transcription usage logged:', usageData);
      
      // TODO: Store in database
      // await storeTranscriptionUsage(usageData);
      
      res.json({
        success: true,
        message: 'Usage logged successfully'
      });
      
    } catch (error) {
      console.error('Usage logging error:', error);
      res.status(500).json({
        error: 'Failed to log usage',
        code: 'USAGE_LOG_FAILED'
      });
    }
  }
);

/**
 * GET /api/transcription/health
 * Health check for transcription service
 */
router.get('/health', (req, res) => {
  try {
    const sonioxApiKey = getSonioxApiKey();
    const isConfigured = Boolean(sonioxApiKey && validateSonioxApiKey(sonioxApiKey));
    
    res.json({
      status: 'ok',
      service: 'transcription',
      configured: isConfigured,
      timestamp: new Date().toISOString(),
      features: {
        apiKeyManagement: true,
        rateLimiting: true,
        securityHeaders: true,
        usageLogging: true
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      service: 'transcription',
      error: error.message
    });
  }
});

/**
 * POST /api/transcription/feedback
 * Collect user feedback on transcription accuracy
 */
router.post('/feedback',
  authenticateTranscription,
  validateTranscriptionSession,
  async (req, res) => {
    try {
      const { sessionId } = req;
      const userId = req.transcriptionUser.id;
      const {
        originalText,
        correctedText,
        confidence,
        language,
        section,
        rating,
        comments
      } = req.body;
      
      const feedbackData = {
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        originalText: originalText || '',
        correctedText: correctedText || '',
        confidence: parseFloat(confidence) || 0,
        language: language || 'en',
        section: section || 'general',
        rating: parseInt(rating) || null, // 1-5 rating
        comments: comments || null
      };
      
      console.log('Transcription feedback received:', feedbackData);
      
      // TODO: Store feedback for model improvement
      // await storeTranscriptionFeedback(feedbackData);
      
      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });
      
    } catch (error) {
      console.error('Feedback submission error:', error);
      res.status(500).json({
        error: 'Failed to submit feedback',
        code: 'FEEDBACK_FAILED'
      });
    }
  }
);

/**
 * Error handling middleware for transcription routes
 */
router.use((error, req, res, next) => {
  console.error('Transcription route error:', error);
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  res.status(500).json({
    error: 'Internal transcription service error',
    code: 'INTERNAL_ERROR'
  });
});

export default router;