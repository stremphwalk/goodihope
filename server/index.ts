import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, corsMiddleware, createRateLimiter, errorHandler } from "./security";
import 'dotenv/config';

const app = express();

// Apply compression middleware for better performance
app.use(compression({
  // Only compress files larger than 1kb
  threshold: 1024,
  // Compression level (1-9, 6 is default)
  level: 6,
  // Don't compress these file types
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Compress everything else
    return compression.filter(req, res);
  }
}));

// Apply security middleware
app.use(securityHeaders);
app.use(corsMiddleware);

// Rate limiting for API endpoints
app.use('/api', createRateLimiter());

// Stricter rate limiting for image processing endpoints
app.use('/api/extract-lab-values', createRateLimiter(10));
app.use('/api/medications/extract-from-image', createRateLimiter(10));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add a basic health check endpoint that doesn't depend on any external services
app.get('/health', (req, res) => {
  // Simple health check that just returns OK - no database or external dependencies
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

(async () => {
  try {
    log('Starting server initialization...');
    log(`Environment: ${process.env.NODE_ENV}`);
    log(`Port: ${process.env.PORT || 'not set, using 5001'}`);
    
    // Register routes with error handling
    let server;
    try {
      log('Registering routes...');
      server = await registerRoutes(app);
      log('Routes registered successfully');
    } catch (error) {
      log(`❌ Failed to register routes: ${error}`);
      // Continue anyway - maybe some routes failed but we can still serve health check
      server = require("http").createServer(app);
    }

    app.use(errorHandler);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "development") {
      log('Setting up Vite for development...');
      await setupVite(app, server);
    } else {
      log('Setting up static file serving for production...');
      try {
        serveStatic(app);
        log('Static file serving setup complete');
      } catch (error) {
        log(`Warning: Error setting up static files: ${error}`);
        // Don't throw - server can still run without static files for health check
      }
    }

    // Use process.env.PORT for Railway/production, fallback to 5001 for development
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
    log(`Attempting to start server on port ${port}...`);
    
    server.listen(port, "0.0.0.0", () => {
      log(`✅ Server successfully started on port ${port}`);
      log(`Health check available at http://0.0.0.0:${port}/health`);
    });

    server.on('error', (error: any) => {
      log(`❌ Server error: ${error.message}`);
      if (error.code === 'EACCES') {
        log(`❌ Permission denied for port ${port}. Check port availability.`);
      } else if (error.code === 'EADDRINUSE') {
        log(`❌ Port ${port} is already in use.`);
      }
      process.exit(1);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      log(`🛑 Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        log('🔒 HTTP server closed');
        
        // Close database connections
        try {
          const { closeDatabase } = await import('./database');
          await closeDatabase();
        } catch (error) {
          log(`Warning: Error closing database: ${error}`);
        }
        
        log('✅ Graceful shutdown complete');
        process.exit(0);
      });
      
      // Force close after 5 seconds
      setTimeout(() => {
        log('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    log(`❌ Failed to start server: ${error}`);
    console.error('Full error details:', error);
    process.exit(1);
  }
})();
