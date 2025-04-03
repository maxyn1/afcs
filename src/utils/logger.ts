type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogData = { error?: string; stack?: string } | Record<string, unknown> | null | undefined;

class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  private log(level: LogLevel, message: string, data?: LogData) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    if (this.isDevelopment) {
      const color = {
        debug: '#7f7f7f',
        info: '#2196f3',
        warn: '#ff9800',
        error: '#f44336'
      }[level];

      console.log(
        `%c${level.toUpperCase()}%c ${timestamp}:`,
        `color: ${color}; font-weight: bold;`,
        'color: inherit;',
        message,
        data || ''
      );
    }

    // Store logs in localStorage for debugging
    const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('app_logs', JSON.stringify(logs.slice(-100))); // Keep last 100 logs
  }

  debug(message: string, data?: LogData) {
    this.log('debug', message, data);
  }

  info(message: string, data?: LogData) {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | string | unknown) {
    this.log('error', message, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  getLogs() {
    return JSON.parse(localStorage.getItem('app_logs') || '[]');
  }

  clearLogs() {
    localStorage.removeItem('app_logs');
  }
}

export const logger = Logger.getInstance();
