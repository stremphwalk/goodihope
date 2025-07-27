import { Request, Response, NextFunction } from 'express';
import { createServerSupabaseClient } from '../lib/supabase';
import { userQueries } from './database-supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  supabaseUser?: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without auth - let routes handle it
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next(); // Continue without auth
    }

    // Get the corresponding user record from our users table
    try {
      const userData = await userQueries.getUserById(user.id);
      req.user = userData;
      req.supabaseUser = user;
    } catch (dbError) {
      // User might not exist in our users table yet - that's ok
      req.supabaseUser = user;
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(); // Continue without auth on error
  }
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user && !req.supabaseUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};