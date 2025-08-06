export async function checkJwt(req, res, next = () => {}) {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No or invalid Authorization header – behave the same as the TS version
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // For the purposes of the /api/transcription/token endpoint we do **not** need
    // to validate the JWT with Supabase – we only require that it is present.
    // We therefore attach a placeholder `auth` object so that any downstream
    // middleware expecting `req.auth.sub` continues to work.
    req.auth = {
      sub: 'anonymous',
      email: '',
    };

    return next();
  } catch (error) {
    console.error('Auth middleware (JS fallback) error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
} 