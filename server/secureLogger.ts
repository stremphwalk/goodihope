/**
 * Secure logging utility to prevent log injection attacks
 */

// Characters that could be used for log injection
const LOG_INJECTION_CHARS = /[\r\n\t\x00-\x1f\x7f-\x9f]/g;

/**
 * Sanitize log messages to prevent log injection
 */
export function sanitizeLogMessage(message: any): string {
  if (typeof message === 'string') {
    return message.replace(LOG_INJECTION_CHARS, '').substring(0, 1000);
  }
  
  if (typeof message === 'object' && message !== null) {
    try {
      const sanitized = JSON.stringify(message, null, 2);
      return sanitized.replace(LOG_INJECTION_CHARS, '').substring(0, 1000);
    } catch {
      return '[Object - could not serialize]';
    }
  }
  
  return String(message).replace(LOG_INJECTION_CHARS, '').substring(0, 1000);
}

/**
 * Secure console logging functions
 */
export const secureLog = {
  info: (message: any, ...args: any[]) => {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedArgs = args.map(sanitizeLogMessage);
    console.log(sanitizedMessage, ...sanitizedArgs);
  },
  
  error: (message: any, ...args: any[]) => {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedArgs = args.map(sanitizeLogMessage);
    console.error(sanitizedMessage, ...sanitizedArgs);
  },
  
  warn: (message: any, ...args: any[]) => {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedArgs = args.map(sanitizeLogMessage);
    console.warn(sanitizedMessage, ...sanitizedArgs);
  },
  
  debug: (message: any, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitizedMessage = sanitizeLogMessage(message);
      const sanitizedArgs = args.map(sanitizeLogMessage);
      console.debug(sanitizedMessage, ...sanitizedArgs);
    }
  }
};

/**
 * Create a safe log context for structured logging
 */
export function createLogContext(context: Record<string, any>): string {
  const sanitizedContext: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(context)) {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50);
    sanitizedContext[sanitizedKey] = sanitizeLogMessage(value);
  }
  
  return JSON.stringify(sanitizedContext);
}