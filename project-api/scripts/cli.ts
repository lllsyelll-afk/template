import {
  checkApiConnection,
  askMultipleChoice,
  rl,
  cliApiKey,
  question,
} from "./utils";
import { createAdmin, updatePermissions } from "./commands/admin";
import { manageQueue } from "./commands/queue";

// =====================
// MAIN MENU
// =====================
const showMenu = async (): Promise<void> => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║        ✅ APP - SYSTEM - CLI TOOL     ║");
  console.log("║        Command Management System       ║");
  console.log("╚════════════════════════════════════════╝\n");

  const commands = [
    "🔑 Create Admin User",
    "🔐 Update User Permissions",
    "📬 Async Job Queue Manager",
    "❌ Exit",
  ];

  const choice = await askMultipleChoice("Select a command:", commands);

  switch (choice) {
    case "🔑 Create Admin User":
      await createAdmin();
      break;
    case "🔐 Update User Permissions":
      await updatePermissions();
      break;
    case "📬 Async Job Queue Manager":
      await manageQueue();
      break;
    case "❌ Exit":
      console.log("\n� Goodbye!");
      rl.close();
      process.exit(0);
      return;
  }

  await showMenu();
};

// =====================
// MAIN
// =====================
const main = async (): Promise<void> => {
  await checkApiConnection();

  const envApiKey = process.env.CLI_API_KEY;
  if (envApiKey) {
    cliApiKey.value = envApiKey;
    console.log("🔐 Using CLI API key from environment");
  } else {
    console.log("\n🔐 CLI Authentication Required");
    console.log("💡 Set CLI_API_KEY environment variable to avoid prompts");
    const apiKey = await question("Enter CLI API Key: ");
    cliApiKey.value = apiKey.trim();
  }

  if (cliApiKey.value) {
    const maskedKey =
      cliApiKey.value.substring(0, 8) + "*".repeat(cliApiKey.value.length - 8);
    console.log(`🔑 API Key configured: ${maskedKey}`);
  }

  await showMenu();
};

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
