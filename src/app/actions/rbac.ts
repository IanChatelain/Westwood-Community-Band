'use server';

import {
  getAllRolePermissions,
  updateRolePermission,
  getCurrentUserPermissions,
} from '@/lib/rbac';
import type { PermissionKey, RolePermissionMap } from '@/types';

export async function listRolePermissions(): Promise<Record<string, RolePermissionMap>> {
  return getAllRolePermissions();
}

export async function setRolePermission(
  role: string,
  permission: PermissionKey,
  enabled: boolean,
): Promise<{ error: string | null }> {
  return updateRolePermission(role, permission, enabled);
}

export async function fetchCurrentUserPermissions(): Promise<RolePermissionMap | null> {
  return getCurrentUserPermissions();
}
