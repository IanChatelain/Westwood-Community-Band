'use server';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import type { UserRole } from '@/types';

export async function updateProfileRole(
  profileId: string,
  newRole: UserRole,
): Promise<{ error: string | null }> {
  try {
    await requireAdmin();
  } catch {
    return { error: 'Only admins can change roles' };
  }

  const validRoles = ['ADMIN', 'EDITOR', 'MEMBER', 'GUEST'];
  if (!validRoles.includes(newRole)) return { error: 'Invalid role' };

  try {
    await db
      .update(profiles)
      .set({ role: newRole, updatedAt: new Date().toISOString() })
      .where(eq(profiles.id, profileId));
    return { error: null };
  } catch (err) {
    console.error('updateProfileRole failed:', err);
    return { error: 'Failed to update role' };
  }
}

export async function listProfiles(): Promise<{
  id: string;
  username: string;
  role: string;
  email: string;
}[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      role: profiles.role,
      email: profiles.email,
    })
    .from(profiles)
    .orderBy(profiles.username);

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    role: r.role,
    email: r.email ?? '',
  }));
}
