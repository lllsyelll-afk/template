import dotenv from "dotenv";
import { validateApiKey } from "../utils/validation";

// Load environment variables
dotenv.config();

export interface AppConfig {
  // API Configuration
  apiUrl: string;
  apiVersion: string;

  // Authentication
  cliApiKey?: string;
  encryptionKey: string;

  // Development/Production
  environment: "development" | "production" | "test";
  isDevelopment: boolean;

  // Security
  maxRetries: number;
  requestTimeout: number;

  // Logging
  logLevel: "debug" | "info" | "warn" | "error";
  enableConsoleLogging: boolean;
}

class ConfigManager {
  private _config: AppConfig;
  private _validated = false;

  constructor() {
    this._config = this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration(): AppConfig {
    const environment = (process.env.ENV ||
      "development") as AppConfig["environment"];
    const isDevelopment = environment === "development";

    return {
      // API Configuration
      apiUrl: process.env.VITR_API_URL || "http://localhost:45231/",
      apiVersion: process.env.VITE_API_VERSION || "v1",

      // Authentication
      cliApiKey: process.env.CLI_API_KEY,
      encryptionKey:
        process.env.ENCRYPTION_KEY || this.generateDefaultEncryptionKey(),

      // Development/Production
      environment,
      isDevelopment,

      // Security
      maxRetries: isDevelopment ? 2 : 5,
      requestTimeout: isDevelopment ? 10000 : 30000,

      // Logging
      logLevel: (process.env.LOG_LEVEL || "info") as AppConfig["logLevel"],
      enableConsoleLogging: process.env.ENABLE_CONSOLE_LOGGING !== "false",
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate API URL
    if (!this._config.apiUrl) {
      errors.push("API_URL is required");
    }

    // Validate encryption key in production
    if (!this._config.isDevelopment) {
      if (!process.env.ENCRYPTION_KEY) {
        errors.push("ENCRYPTION_KEY must be set in production");
      }
    }

    // Validate CLI API key if provided
    if (this._config.cliApiKey) {
      const validation = validateApiKey(this._config.cliApiKey);
      if (!validation.isValid) {
        errors.push(`Invalid CLI API key: ${validation.errors.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      console.error("❌ Configuration validation failed:");
      errors.forEach((error) => console.error(`   - ${error}`));
      if (!this._config.isDevelopment) {
        process.exit(1);
      } else {
        console.warn(
          "⚠️  Continuing in development mode with configuration issues",
        );
      }
    }

    this._validated = true;
  }

  private generateDefaultEncryptionKey(): string {
    console.warn(
      "⚠️  Using default encryption key. Set ENCRYPTION_KEY environment variable for production.",
    );
    return "7a7dd70807695a9aa7a70df81cf983497a7dd70807695a9aa7a70df81cf98349";
  }

  get config(): AppConfig {
    if (!this._validated) {
      throw new Error("Configuration not validated");
    }
    return { ...this._config };
  }

  // Convenience getters
  get apiUrl(): string {
    return this._config.apiUrl;
  }

  get cliApiKey(): string | undefined {
    return this._config.cliApiKey;
  }

  
  get encryptionKey(): string {
    return this._config.encryptionKey;
  }

  get isProduction(): boolean {
    return this._config.environment === "production";
  }

  get logLevel(): AppConfig["logLevel"] {
    return this._config.logLevel;
  }

  get enableConsoleLogging(): boolean {
    return this._config.enableConsoleLogging;
  }

  get isDevelopment(): boolean {
    return this._config.isDevelopment;
  }

  // Runtime configuration updates (for testing)
  updateConfig(updates: Partial<AppConfig>): void {
    this._config = { ...this._config, ...updates };
  }

  // Configuration summary for debugging
  getSummary(): object {
    return {
      environment: this._config.environment,
      apiUrl: this._config.apiUrl,
      hasCliApiKey: !!this._config.cliApiKey,
      hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      logLevel: this._config.logLevel,
    };
  }
}

// Export singleton instance
export const config = new ConfigManager();
