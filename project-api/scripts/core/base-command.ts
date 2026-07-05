import { logger } from "../utils/logger";
import { state } from "./state";
import { api } from "../utils";

export interface CommandContext {
  state: typeof state;
  api: typeof api;
  logger: typeof logger;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: Error;
}

export abstract class BaseCommand {
  public context: CommandContext;
  protected name: string;
  protected description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.context = {
      state,
      api,
      logger,
    };
  }

  // Abstract method that must be implemented by concrete commands
  abstract execute(...args: unknown[]): Promise<CommandResult>;

  // Helper methods for common operations
  protected async requireAuth(): Promise<void> {
    if (!this.context.state.isAuthenticated()) {
      throw new Error("Authentication required for this command");
    }
  }

  protected logStart(): void {
    this.context.logger.info(`Executing command: ${this.name}`, {}, "COMMAND");
  }

  protected logSuccess(result?: CommandResult): void {
    this.context.logger.info(
      `Command completed: ${this.name}`,
      {
        success: true,
        result: result?.data,
      },
      "COMMAND",
    );
  }

  protected logError(error: Error): void {
    this.context.logger.error(
      `Command failed: ${this.name}`,
      {
        error: error.message,
        stack: error.stack,
      },
      "COMMAND",
    );
  }

  protected createResult(
    success: boolean,
    message?: string,
    data?: unknown,
    error?: Error,
  ): CommandResult {
    return { success, message, data, error };
  }

  // Execute with error handling and logging
  async run(...args: unknown[]): Promise<CommandResult> {
    const timer = this.context.logger.startTimer(this.name);

    try {
      this.logStart();
      const result = await this.execute(...args);
      this.logSuccess(result);
      timer();
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logError(err);
      timer();
      return this.createResult(false, err.message, undefined, err);
    }
  }

  // Get command metadata
  getInfo(): { name: string; description: string } {
    return {
      name: this.name,
      description: this.description,
    };
  }
}
