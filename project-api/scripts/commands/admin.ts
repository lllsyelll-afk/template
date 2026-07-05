import {
  api,
  question,
  askYesNo,
  askMultipleChoice,
  askCheckbox,
  ApiError,
} from "../utils";

// =====================
// COMMAND: CREATE ADMIN USER
// =====================
export const createAdmin = async (): Promise<void> => {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("       CREATE ADMIN USER");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const name = await question("Enter admin name: ");
  if (!name) {
    console.log("❌ Name is required.");
    return;
  }

  const phone = await question("Enter phone number (e.g. +2135XXXXXXXX): ");
  if (!phone) {
    console.log("❌ Phone is required.");
    return;
  }

  const email = await question("Enter email (optional, press Enter to skip): ");
  const password = await question("Enter password (min 6 chars): ");
  if (!password || password.length < 6) {
    console.log("❌ Password must be at least 6 characters.");
    return;
  }

  // Fetch available permissions
  let availablePermissions: string[];
  try {
    const data = await api.get<{ permissions: string[] }>(
      "/cli/users/permissions/list",
    );
    availablePermissions = data.permissions;
  } catch (error) {
    console.log(
      "❌ Failed to fetch permissions list:",
      error instanceof ApiError ? error.message : String(error),
    );
    return;
  }

  // Select permissions using interactive checkbox
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   AVAILABLE PERMISSIONS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const selectedPermissions = await askCheckbox(
    "Select permissions (Space to toggle, Enter to confirm):",
    availablePermissions.map((perm) => ({ value: perm, name: perm })),
    { includeSelectAll: true },
  );

  if (selectedPermissions.length === 0) {
    console.log("❌ No permissions selected.");
    return;
  }

  console.log(`\n✅ Selected ${selectedPermissions.length} permission(s):`);
  selectedPermissions.forEach((p) => console.log(`   • ${p}`));

  const confirm = await askYesNo("\nCreate admin user with these permissions?");
  if (!confirm) {
    console.log("❌ Cancelled.");
    return;
  }

  try {
    const data = await api.post<{ user: Record<string, unknown> }>(
      "/cli/users/create-admin",
      {
        name,
        phone,
        email: email || undefined,
        password,
        permissions: selectedPermissions,
      },
    );
    console.log("\n✅ Admin user created successfully!");
    console.log(`   ID: ${data.user._id}`);
    console.log(`   Name: ${data.user.name}`);
    console.log(`   Phone: ${data.user.phone}`);
    if (data.user.email) console.log(`   Email: ${data.user.email}`);
    console.log(
      `   Permissions: ${(data.user.permissions as string[])?.length || 0}`,
    );
  } catch (error) {
    console.log(
      "\n❌ Failed to create admin user:",
      error instanceof ApiError ? error.message : String(error),
    );
  }
};

// =====================
// COMMAND: UPDATE USER PERMISSIONS
// =====================
export const updatePermissions = async (): Promise<void> => {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("     UPDATE USER PERMISSIONS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // List users to pick from
  let users: Array<{ _id: string; name: string; phone: string; permissions?: string[] }>;
  try {
    const data = await api.get<{ users: Array<{ _id: string; name: string; phone: string; permissions?: string[] }> }>(
      "/cli/users",
    );
    users = data.users;
  } catch (error) {
    console.log(
      "❌ Failed to fetch users:",
      error instanceof ApiError ? error.message : String(error),
    );
    return;
  }

  if (users.length === 0) {
    console.log("❌ No users found.");
    return;
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   SELECT A USER");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  const userOptions = users.map(
    (u) =>
      `${u.name} (${u.phone})${u.permissions && u.permissions.length > 0 ? ` [${u.permissions.length} perms]` : ""}`,
  );
  userOptions.push("🔙 Cancel");

  const choice = await askMultipleChoice("Select a user:", userOptions);
  if (choice === "🔙 Cancel") {
    console.log("❌ Cancelled.");
    return;
  }

  const selectedIndex = userOptions.indexOf(choice);
  const selectedUser = users[selectedIndex];

  console.log(`\n📋 Current permissions for ${selectedUser.name}:`);
  if (selectedUser.permissions && selectedUser.permissions.length > 0) {
    selectedUser.permissions.forEach((p) => console.log(`   • ${p}`));
  } else {
    console.log("   (none)");
  }

  // Fetch available permissions
  let availablePermissions: string[];
  try {
    const data = await api.get<{ permissions: string[] }>(
      "/cli/users/permissions/list",
    );
    availablePermissions = data.permissions;
  } catch (error) {
    console.log(
      "❌ Failed to fetch permissions list:",
      error instanceof ApiError ? error.message : String(error),
    );
    return;
  }

  // Select permissions using interactive checkbox with current permissions pre-checked
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   AVAILABLE PERMISSIONS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const selectedPermissions = await askCheckbox(
    "Select permissions (Space to toggle, Enter to confirm):",
    availablePermissions.map((perm) => ({
      value: perm,
      name: perm,
      checked: selectedUser.permissions?.includes(perm) ?? false,
    })),
    { includeClearAll: true },
  );

  if (selectedPermissions.length === 0) {
    console.log("\n⚠️  No permissions selected (will remove all).");
  } else {
    console.log(`\n✅ Selected ${selectedPermissions.length} permission(s):`);
    selectedPermissions.forEach((p) => console.log(`   • ${p}`));
  }

  const confirm = await askYesNo("\nUpdate permissions for this user?");
  if (!confirm) {
    console.log("❌ Cancelled.");
    return;
  }

  try {
    const data = await api.patch<{ user: Record<string, unknown> }>(
      `/cli/users/${selectedUser._id}/permissions`,
      { permissions: selectedPermissions },
    );
    console.log("\n✅ Permissions updated successfully!");
    console.log(`   User: ${data.user.name}`);
    console.log(
      `   Permissions: ${(data.user.permissions as string[])?.length || 0}`,
    );
  } catch (error) {
    console.log(
      "\n❌ Failed to update permissions:",
      error instanceof ApiError ? error.message : String(error),
    );
  }
};
