import { Request, Response, NextFunction } from 'express';
import { createServerSupabaseClient } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string;
    email: string;
    [key: string]: any;
  };
}

// Middleware for validating Supabase JWT tokens
export const checkJwt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Use Supabase to verify the JWT token
    const supabase = createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Add user info to request object for downstream use
    req.auth = {
      sub: user.id,
      email: user.email || '',
      ...user.user_metadata
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}; 