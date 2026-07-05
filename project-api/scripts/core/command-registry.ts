import { BaseCommand, CommandResult } from "./base-command";
import { logger } from "../utils/logger";

export interface CommandInfo {
  name: string;
  description: string;
  category: "auth" | "user" | "admin" | "data" | "utility";
  requiresAuth: boolean;
  command: BaseCommand;
}

class CommandRegistry {
  private commands = new Map<string, CommandInfo>();
  private categories = new Map<string, CommandInfo[]>();

  register(commandInfo: CommandInfo): void {
    // Validate command info
    if (!commandInfo.name || !commandInfo.command) {
      throw new Error("Command must have a name and command instance");
    }

    // Check for duplicates
    if (this.commands.has(commandInfo.name)) {
      throw new Error(`Command '${commandInfo.name}' is already registered`);
    }

    // Register command
    this.commands.set(commandInfo.name, commandInfo);

    // Add to category
    if (!this.categories.has(commandInfo.category)) {
      this.categories.set(commandInfo.category, []);
    }
    this.categories.get(commandInfo.category)!.push(commandInfo);

    logger.debug(
      `Registered command: ${commandInfo.name}`,
      {
        category: commandInfo.category,
        requiresAuth: commandInfo.requiresAuth,
      },
      "REGISTRY",
    );
  }

  unregister(name: string): boolean {
    const commandInfo = this.commands.get(name);
    if (!commandInfo) {
      return false;
    }

    // Remove from main registry
    this.commands.delete(name);

    // Remove from category
    const categoryCommands = this.categories.get(commandInfo.category);
    if (categoryCommands) {
      const index = categoryCommands.findIndex((cmd) => cmd.name === name);
      if (index !== -1) {
        categoryCommands.splice(index, 1);
      }
    }

    logger.debug(`Unregistered command: ${name}`, {}, "REGISTRY");
    return true;
  }

  get(name: string): CommandInfo | undefined {
    return this.commands.get(name);
  }

  list(): CommandInfo[] {
    return Array.from(this.commands.values());
  }

  listByCategory(category: string): CommandInfo[] {
    return this.categories.get(category) || [];
  }

  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  // Get commands available to current user state
  getAvailableCommands(): CommandInfo[] {
    return this.list().filter((cmd) => {
      // Check authentication requirements
      if (cmd.requiresAuth && !cmd.command.context.state.isAuthenticated()) {
        return false;
      }

      return true;
    });
  }

  // Execute a command by name
  async execute(name: string, ...args: unknown[]): Promise<CommandResult> {
    const commandInfo = this.get(name);
    if (!commandInfo) {
      return {
        success: false,
        message: `Command '${name}' not found`,
      };
    }

    logger.info(
      `Executing command: ${name}`,
      {
        category: commandInfo.category,
        args: args.length,
      },
      "REGISTRY",
    );

    try {
      return await commandInfo.command.run(...args);
    } catch (error) {
      logger.error(
        `Command execution failed: ${name}`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
        "REGISTRY",
      );

      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Search commands by name or description
  search(query: string): CommandInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery),
    );
  }

  // Get registry statistics
  getStats(): {
    totalCommands: number;
    categories: Record<string, number>;
    commandsRequiringAuth: number;
  } {
    const commands = this.list();
    const categoryStats: Record<string, number> = {};

    for (const category of this.getCategories()) {
      categoryStats[category] = this.listByCategory(category).length;
    }

    return {
      totalCommands: commands.length,
      categories: categoryStats,
      commandsRequiringAuth: commands.filter((cmd) => cmd.requiresAuth).length,
    };
  }

  // Clear all commands (useful for testing)
  clear(): void {
    this.commands.clear();
    this.categories.clear();
    logger.debug("Command registry cleared", {}, "REGISTRY");
  }
}

// Export singleton instance
export const commandRegistry = new CommandRegistry();

// Export function for manual command registration
export function registerCommand(
  command: BaseCommand,
  info: Omit<CommandInfo, "command">,
): void {
  commandRegistry.register({
    ...info,
    command,
  });
}
