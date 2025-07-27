import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    
    
    // For now, return a simple response for other API endpoints
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