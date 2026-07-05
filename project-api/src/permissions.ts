export const ADMIN_PERMISSIONS = {
  users: {
    view: "admin.users.view",
    edit: "admin.users.edit",
    block: "admin.users.block",
    delete: "admin.users.delete",
  },
} as const;

export const ALL_ADMIN_PERMISSIONS: string[] = Object.values(
  ADMIN_PERMISSIONS,
).flatMap((group) => Object.values(group));

export function hasAnyAdminPermission(permissions: string[] | undefined): boolean {
  if (!permissions || permissions.length === 0) return false;
  return permissions.some((p) => p.startsWith("admin."));
}
