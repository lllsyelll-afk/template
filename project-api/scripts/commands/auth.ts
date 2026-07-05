import {
  api,
  authToken,
  currentUser,
  question,
} from "../utils";

// =====================
// COMMAND: LOGIN
// =====================
export const login = async (): Promise<boolean> => {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("            🔑 LOGIN");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const identifier = await question("📱 Phone or Email: ");
  if (!identifier) {
    console.log("❌ Identifier is required!\n");
    return false;
  }

  const password = await question("🔐 Password: ");
  if (!password) {
    console.log("❌ Password is required!\n");
    return false;
  }

  try {
    const res = await api.post<{
      token: string;
      user: {
        _id: string;
        name: string;
        phone: string;
        email?: string;
        photo?: string;
        blocked: boolean;
        permissions?: string[];
      };
    }>("/auth/login", {
      identifier,
      password,
    });

    authToken.value = res.token;
    currentUser.value = res.user;

    console.log(
      `\n✅ Logged in as ${currentUser.value.name}!\n`,
    );
    return true;
  } catch (error) {
    console.log(`\n❌ Login failed:`, (error as Error).message, "\n");
    return false;
  }
};

// =====================
// COMMAND: LOGOUT / BACK TO MAIN
// =====================
export const logout = (): void => {
  authToken.value = null;
  currentUser.value = null;
  console.log("🔓 Logged out successfully!\n");
};
