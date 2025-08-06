import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import transcription-specific handlers
async function handleTranscriptionDebug(req: VercelRequest, res: VercelResponse) {
  try {
    const { getSonioxApiKey } = await import('../server/middleware/transcriptionAuth.js');
    const hasApiKey = !!getSonioxApiKey();
    const apiKeyLength = getSonioxApiKey()?.length || 0;
    
    return res.json({
      hasApiKey,
      apiKeyLength,
      nodeEnv: process.env.NODE_ENV,
      availableSonioxKeys: Object.keys(process.env).filter(key => key.includes('SONIOX')),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({
      error: 'Debug endpoint failed',
      timestamp: new Date().toISOString()
    });
  }
}

async function handleTranscriptionToken(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Import necessary modules
    const { getSonioxApiKey, validateSonioxApiKey } = await import('../server/middleware/transcriptionAuth.js');
    const { checkJwt } = await import('../server/auth.js');
    
    // Simple auth check (without full middleware setup)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

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
    
    return res.json({
      token: sonioxApiKey,
      sessionId: req.body?.sessionId || 'default',
      expiresIn: 3600,
      config: {
        maxDuration: 30000,
        model: 'stt-rt-preview',
        supportedLanguages: ['en', 'fr']
      }
    });
    
  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate transcription token',
      code: 'TOKEN_GENERATION_FAILED'
    });
  }
}

// Basic health check endpoint
async function handleHealthCheck(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasNeonUrl: !!process.env.NEON_DATABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    }
  });
}

// Database health check endpoint
async function handleDbHealthCheck(req: VercelRequest, res: VercelResponse) {
  try {
    const { checkDatabaseHealth } = await import('../server/database-neon.js');
    const dbHealth = await checkDatabaseHealth();
    
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`Handling request: ${req.method} ${req.url}`);
    
    // Route specific endpoints
    if (req.url === '/health' || req.url === '/api/health') {
      return handleHealthCheck(req, res);
    }
    
    if (req.url === '/db-health' || req.url === '/api/db-health') {
      return handleDbHealthCheck(req, res);
    }
    
    // Handle transcription routes
    if (req.url === '/api/transcription/debug') {
      return handleTranscriptionDebug(req, res);
    }
    
    if (req.url === '/api/transcription/token') {
      return handleTranscriptionToken(req, res);
    }
    
    // For other API endpoints, return a simple response
    return res.status(200).json({
      message: 'API endpoint working',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 