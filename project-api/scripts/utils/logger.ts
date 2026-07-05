import fs from "fs";
import path from "path";
import { config } from "../config";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  module?: string;
}

class Logger {
  private logFile: string | null = null;
  private logLevel: LogLevel;
  private enableConsoleLogging: boolean;

  constructor() {
    this.logLevel = config.logLevel;
    this.enableConsoleLogging = config.enableConsoleLogging;

    // Set up log file in development
    if (config.isDevelopment) {
      const logsDir = path.join(process.cwd(), "scripts", "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      this.logFile = path.join(
        logsDir,
        `cli-${new Date().toISOString().split("T")[0]}.log`,
      );
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private formatLogEntry(entry: LogEntry): string {
    const metadataStr = entry.metadata
      ? ` ${JSON.stringify(entry.metadata)}`
      : "";
    const moduleStr = entry.module ? `[${entry.module}] ` : "";
    return `${entry.timestamp} ${entry.level.toUpperCase()} ${moduleStr}${entry.message}${metadataStr}`;
  }

  private writeLog(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);

    // Console logging
    if (this.enableConsoleLogging) {
      switch (entry.level) {
        case "debug":
          console.debug(`🔍 ${formatted}`);
          break;
        case "info":
          console.info(`ℹ️  ${formatted}`);
          break;
        case "warn":
          console.warn(`⚠️  ${formatted}`);
          break;
        case "error":
          console.error(`❌ ${formatted}`);
          break;
      }
    }

    // File logging
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formatted + "\n");
      } catch (error) {
        console.error("Failed to write to log file:", error);
      }
    }
  }

  debug(
    message: string,
    metadata?: Record<string, unknown>,
    module?: string,
  ): void {
    if (!this.shouldLog("debug")) return;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "debug",
      message,
      metadata,
      module,
    });
  }

  info(
    message: string,
    metadata?: Record<string, unknown>,
    module?: string,
  ): void {
    if (!this.shouldLog("info")) return;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      metadata,
      module,
    });
  }

  warn(
    message: string,
    metadata?: Record<string, unknown>,
    module?: string,
  ): void {
    if (!this.shouldLog("warn")) return;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      metadata,
      module,
    });
  }

  error(
    message: string,
    metadata?: Record<string, unknown>,
    module?: string,
  ): void {
    if (!this.shouldLog("error")) return;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      metadata,
      module,
    });
  }

  // Specialized logging methods
  apiCall(
    method: string,
    url: string,
    status?: number,
    duration?: number,
  ): void {
    this.debug(
      "API Call",
      {
        method,
        url,
        status,
        duration: duration ? `${duration}ms` : undefined,
      },
      "API",
    );
  }

  authEvent(event: string, userId?: string): void {
    this.info(
      `Auth: ${event}`,
      {
        userId: userId || "anonymous",
      },
      "AUTH",
    );
  }

  securityEvent(event: string, details?: Record<string, unknown>): void {
    this.warn(`Security: ${event}`, details, "SECURITY");
  }

  commandExecution(
    command: string,
    success: boolean,
    duration?: number,
    error?: string,
  ): void {
    this.info(
      `Command: ${command}`,
      {
        success,
        duration: duration ? `${duration}ms` : undefined,
        error,
      },
      "CLI",
    );
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer: ${label}`, { duration: `${duration}ms` }, "PERF");
    };
  }

  // Get log statistics
  getLogStats(): {
    file: string | null;
    level: LogLevel;
    consoleEnabled: boolean;
  } {
    return {
      file: this.logFile,
      level: this.logLevel,
      consoleEnabled: this.enableConsoleLogging,
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for module-specific loggers
export const createModuleLogger = (moduleName: string) => ({
  debug: (message: string, metadata?: Record<string, unknown>) =>
    logger.debug(message, metadata, moduleName),
  info: (message: string, metadata?: Record<string, unknown>) =>
    logger.info(message, metadata, moduleName),
  warn: (message: string, metadata?: Record<string, unknown>) =>
    logger.warn(message, metadata, moduleName),
  error: (message: string, metadata?: Record<string, unknown>) =>
    logger.error(message, metadata, moduleName),
});
