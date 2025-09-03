interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  context?: string;
  level: 'error' | 'warn' | 'info';
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 logs

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  log(message: string, level: 'error' | 'warn' | 'info' = 'info', context?: string, stack?: string): void {
    const log: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      message,
      stack,
      context,
      level
    };

    this.logs.unshift(log); // Add to beginning
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Don't also log to console to avoid recursion issues
    // The logs will be visible in the debug logs page
  }

  error(message: string, context?: string, error?: Error): void {
    this.log(message, 'error', context, error?.stack);
  }

  warn(message: string, context?: string): void {
    this.log(message, 'warn', context);
  }

  info(message: string, context?: string): void {
    this.log(message, 'info', context);
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Override global console methods to capture all logs
  setupGlobalErrorCapture(): void {
    // Store original methods to prevent recursion
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    console.error = (...args) => {
      try {
        // Use original console.log to avoid recursion in our log method
        const message = args.join(' ');
        this.logs.unshift({
          id: this.generateId(),
          timestamp: new Date().toISOString(),
          message,
          context: 'console',
          level: 'error'
        });
        
        // Keep only maxLogs
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(0, this.maxLogs);
        }
      } catch (e) {
        // Ignore errors in error logger to prevent recursion
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      try {
        const message = args.join(' ');
        this.logs.unshift({
          id: this.generateId(),
          timestamp: new Date().toISOString(),
          message,
          context: 'console',
          level: 'warn'
        });
        
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(0, this.maxLogs);
        }
      } catch (e) {
        // Ignore errors in error logger to prevent recursion
      }
      originalConsoleWarn.apply(console, args);
    };
  }
}

export const errorLogger = new ErrorLogger();
export type { ErrorLog };