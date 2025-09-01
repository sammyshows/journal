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

    // Also log to console
    if (level === 'error') {
      console.error(`[ErrorLogger] ${context ? `[${context}] ` : ''}${message}`, stack || '');
    } else if (level === 'warn') {
      console.warn(`[ErrorLogger] ${context ? `[${context}] ` : ''}${message}`);
    } else {
      console.log(`[ErrorLogger] ${context ? `[${context}] ` : ''}${message}`);
    }
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
    // Capture unhandled errors
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    console.error = (...args) => {
      this.log(args.join(' '), 'error', 'console');
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      this.log(args.join(' '), 'warn', 'console');
      originalConsoleWarn.apply(console, args);
    };

    // Optionally capture console.log too (might be noisy)
    // console.log = (...args) => {
    //   this.log(args.join(' '), 'info', 'console');
    //   originalConsoleLog.apply(console, args);
    // };
  }
}

export const errorLogger = new ErrorLogger();
export type { ErrorLog };