'use server';

import { db } from '@/db';
import { rolePermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  type PermissionKey,
  type RolePermissionMap,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_KEYS,
} from '@/types';
import { getSession } from '@/lib/auth';

// DB column name mapping
const PERMISSION_TO_COLUMN: Record<PermissionKey, keyof typeof rolePermissions.$inferSelect> = {
  access_admin: 'canAccessAdmin',
  manage_users: 'canManageUsers',
  manage_pages: 'canManagePages',
  manage_archive: 'canManageArchive',
  manage_settings: 'canManageSettings',
};

// In-memory cache with a short TTL to avoid excessive DB hits
let permissionsCache: Record<string, { data: RolePermissionMap; ts: number }> = {};
const CACHE_TTL_MS = 30_000;

function rowToPermissionMap(row: typeof rolePermissions.$inferSelect): RolePermissionMap {
  return {
    access_admin: row.canAccessAdmin,
    manage_users: row.canManageUsers,
    manage_pages: row.canManagePages,
    manage_archive: row.canManageArchive,
    manage_settings: row.canManageSettings,
  };
}

export async function invalidatePermissionsCache() {
  permissionsCache = {};
}

/**
 * Seed the role_permissions table with defaults for any roles that don't have a row yet.
 * Safe to call on every app start — it only inserts missing rows.
 */
export async function seedRolePermissions(): Promise<void> {
  for (const role of Object.values(UserRole)) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[role];
    try {
      await db
        .insert(rolePermissions)
        .values({
          role,
          canAccessAdmin: defaults.access_admin,
          canManageUsers: defaults.manage_users,
          canManagePages: defaults.manage_pages,
          canManageArchive: defaults.manage_archive,
          canManageSettings: defaults.manage_settings,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoNothing();
    } catch {
      // row already exists, which is fine
    }
  }
}

export async function getRolePermissions(role: string): Promise<RolePermissionMap> {
  const cached = permissionsCache[role];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const rows = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.role, role));

  if (rows.length > 0) {
    const map = rowToPermissionMap(rows[0]);
    permissionsCache[role] = { data: map, ts: Date.now() };
    return map;
  }

  // Fallback to hardcoded defaults if not seeded yet
  const fallback = DEFAULT_ROLE_PERMISSIONS[role as UserRole] ?? DEFAULT_ROLE_PERMISSIONS[UserRole.GUEST];
  return fallback;
}

export async function hasPermission(role: string, permission: PermissionKey): Promise<boolean> {
  const perms = await getRolePermissions(role);
  return perms[permission];
}

export async function requirePermission(permission: PermissionKey): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const allowed = await hasPermission(session.role, permission);
  if (!allowed) throw new Error(`Permission denied: ${permission}`);
}

export async function getAllRolePermissions(): Promise<Record<string, RolePermissionMap>> {
  const rows = await db.select().from(rolePermissions);
  const result: Record<string, RolePermissionMap> = {};
  for (const row of rows) {
    result[row.role] = rowToPermissionMap(row);
  }
  // Fill in missing roles from defaults
  for (const role of Object.values(UserRole)) {
    if (!result[role]) {
      result[role] = DEFAULT_ROLE_PERMISSIONS[role];
    }
  }
  return result;
}

export async function updateRolePermission(
  role: string,
  permission: PermissionKey,
  enabled: boolean,
): Promise<{ error: string | null }> {
  try {
    await requirePermission('manage_users');
  } catch {
    return { error: 'Permission denied' };
  }

  if (role === UserRole.ADMIN && permission === 'access_admin') {
    return { error: 'Cannot revoke admin panel access from ADMIN role' };
  }
  if (role === UserRole.ADMIN && permission === 'manage_users') {
    return { error: 'Cannot revoke user management from ADMIN role' };
  }

  const col = PERMISSION_TO_COLUMN[permission];
  if (!col) return { error: 'Invalid permission key' };

  try {
    await db
      .update(rolePermissions)
      .set({ [col]: enabled, updatedAt: new Date().toISOString() })
      .where(eq(rolePermissions.role, role));
    invalidatePermissionsCache();
    return { error: null };
  } catch (err) {
    console.error('updateRolePermission failed:', err);
    return { error: 'Failed to update permission' };
  }
}

/**
 * Get the permissions for the currently logged-in user's role.
 * Used to hydrate client-side permission checks.
 */
export async function getCurrentUserPermissions(): Promise<RolePermissionMap | null> {
  const session = await getSession();
  if (!session) return null;
  return getRolePermissions(session.role);
}
