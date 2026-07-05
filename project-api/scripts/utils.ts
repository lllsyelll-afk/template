import readline from "readline";
import dotenv from "dotenv";
import { checkbox, Separator } from "@inquirer/prompts";
import { state } from "./core/state";
import { validateChoice } from "./utils/validation";

// Load environment variables
dotenv.config();

// Configuration with validation
export const API_BASE_URL =
  process.env.CLI_API_URL || "http://localhost:45231/api";

export const API_VERSION =   process.env.CLI_API_VERSION || "v1";

// Admin credentials have been removed for security
// Admin users must be created manually through secure deployment processes

// Legacy exports for backward compatibility
export const cliApiKey = {
  get value() {
    return state.cliApiKey;
  },
  set value(v) {
    state.cliApiKey = v;
  },
};

export const authToken = {
  get value() {
    return state.authToken;
  },
  set value(v) {
    state.authToken = v;
  },
};

export const currentUser = {
  get value() {
    return state.currentUser;
  },
  set value(v) {
    state.currentUser = v;
  },
};
export const createdCredentials = {
  get value() {
    return state.createdCredentials;
  },
  push: (cred: {
    phone: string;
    email?: string;
    password: string;
    name: string;
  }) => state.addCredential(cred),
  get length() {
    return state.createdCredentials.length;
  },
};

// Export state instance for direct access
export { state };

// =====================
// READLINE INTERFACE
// =====================
export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
};

export const askYesNo = async (prompt: string): Promise<boolean> => {
  const answer = await question(`${prompt} (y/n): `);
  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
};

export const askMultipleChoice = async (
  prompt: string,
  options: string[],
): Promise<string> => {
  console.log(`\n${prompt}`);
  options.forEach((option, index) => {
    console.log(`  ${index + 1}.\t${option}`);
  });

  while (true) {
    const choice = await question(`Select option (1-${options.length}): `);
    const validation = validateChoice(choice, options);

    if (!validation.isValid) {
      console.log("❌ " + validation.errors.join(", "));
      continue;
    }

    const index = validation.sanitized as number;
    return options[index];
  }
};

// =====================
// INTERACTIVE CHECKBOX SELECTOR
// =====================
const SELECT_ALL_VALUE = "__CLI_SELECT_ALL__";
const CLEAR_ALL_VALUE = "__CLI_CLEAR_ALL__";

interface CheckboxOption {
  value: string;
  name: string;
  checked?: boolean;
}

export const askCheckbox = async (
  message: string,
  options: CheckboxOption[],
  {
    includeSelectAll = false,
    includeClearAll = false,
  }: { includeSelectAll?: boolean; includeClearAll?: boolean } = {},
): Promise<string[]> => {
  const choices: Array<CheckboxOption | Separator> = [];

  if (includeSelectAll) {
    choices.push({
      value: SELECT_ALL_VALUE,
      name: "[Select all]",
      checked: false,
    });
  }

  if (includeClearAll) {
    choices.push({
      value: CLEAR_ALL_VALUE,
      name: "[Clear all]",
      checked: false,
    });
  }

  if (choices.length > 0) {
    choices.push(new Separator("──────────────────────────"));
  }

  choices.push(...options);

  const result = await checkbox({
    message,
    choices,
    loop: false,
    instructions: true,
    required: false,
  });

  if (result.includes(SELECT_ALL_VALUE)) {
    return options.map((opt) => opt.value);
  }

  if (result.includes(CLEAR_ALL_VALUE)) {
    return [];
  }

  return result.filter(
    (value) => value !== SELECT_ALL_VALUE && value !== CLEAR_ALL_VALUE,
  );
};

// =====================
// API CLIENT FUNCTIONS
// =====================
export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Api-Version": API_VERSION
  };
  if (authToken.value) headers["Authorization"] = `Bearer ${authToken.value}`;
  // Add CLI API key for CLI routes
  if (path.startsWith("/cli") && cliApiKey.value)
    headers["X-Cli-Api-Key"] = cliApiKey.value;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      console.warn(`⚠️  Failed to parse JSON response: ${parseError}`);
      console.warn(
        `Response text: ${text.substring(0, 200)}${text.length > 200 ? "..." : ""}`,
      );
      // ignore JSON parse error
    }
  }

  if (!res.ok) {
    const message =
      (json && typeof json === "object" && "error" in json
        ? String((json as { error: unknown }).error)
        : null) || `HTTP ${res.status}`;
    throw new ApiError(message, res.status, json ?? text);
  }
  return (json as T) ?? ({} as T);
}

export const api = {
  get: <T>(path: string) => apiRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>("PATCH", path, body),
  del: <T>(path: string) => apiRequest<T>("DELETE", path),
};

export const checkApiConnection = async (): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error("API health check failed");
    const data = (await res.json()) as { ok: boolean };
    if (!data.ok) throw new Error("API not healthy");
    console.log("✅ Connected to API\n");
  } catch (error) {
    console.error("❌ Failed to connect to API:", error);
    console.error("💡 Make sure the API server is running on:", API_BASE_URL);
    process.exit(1);
  }
};

// =====================
// UTILITY FUNCTIONS
// =====================
export const generatePassword = (): string => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

export const generatePhone = (): string => {
  const prefixes = ["05", "06", "07"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0");
  return `+213${prefix}${suffix}`;
};

export const generateCoordinates = () => {
  // Algeria coordinates range (roughly)
  const lat = 28 + Math.random() * 8; // 28-36
  const lng = -2 + Math.random() * 10; // -2 to 8
  return { latitude: lat, longitude: lng };
};
