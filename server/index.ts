import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import 'dotenv/config';

const app = express();
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

// Add a comprehensive health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Basic health check without database dependency for Railway health checks
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      port: process.env.PORT || 5000
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

(async () => {
  try {
    log('Starting server initialization...');
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error: ${message}`);
      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      log('Setting up Vite for development...');
      await setupVite(app, server);
    } else {
      log('Setting up static file serving for production...');
      try {
        serveStatic(app);
        log('Static file serving setup complete');
      } catch (error) {
        log(`Error setting up static files: ${error}`);
        throw error;
      }
    }

    // Use process.env.PORT for Railway/production, fallback to 5001 for development
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
    log(`Attempting to start server on port ${port}...`);
    
    server.listen(port, "0.0.0.0", () => {
      log(`✅ Server successfully started on port ${port}`);
    });

    server.on('error', (error) => {
      log(`❌ Server error: ${error.message}`);
      process.exit(1);
    });

  } catch (error) {
    log(`❌ Failed to start server: ${error}`);
    process.exit(1);
  }
})();
