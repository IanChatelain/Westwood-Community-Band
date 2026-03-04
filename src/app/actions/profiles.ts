'use server';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { requirePermission } from '@/lib/rbac';
import type { UserRole } from '@/types';

export async function updateProfileRole(
  profileId: string,
  newRole: UserRole,
): Promise<{ error: string | null }> {
  try {
    await requirePermission('manage_users');
  } catch {
    return { error: 'You do not have permission to change roles' };
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
  isContactRecipient: boolean;
  contactLabel: string | null;
}[]> {
  try {
    await requirePermission('manage_users');
  } catch {
    return [];
  }

  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      role: profiles.role,
      email: profiles.email,
      isContactRecipient: profiles.isContactRecipient,
      contactLabel: profiles.contactLabel,
    })
    .from(profiles)
    .orderBy(profiles.username);

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    role: r.role,
    email: r.email ?? '',
    isContactRecipient: r.isContactRecipient,
    contactLabel: r.contactLabel,
  }));
}

export async function updateProfileContactSettings(
  profileId: string,
  settings: { isContactRecipient: boolean; contactLabel: string | null },
): Promise<{ error: string | null }> {
  try {
    await requirePermission('manage_users');
  } catch {
    return { error: 'You do not have permission to update contact settings' };
  }

  try {
    const contactLabel = settings.isContactRecipient ? settings.contactLabel : null;
    await db
      .update(profiles)
      .set({
        isContactRecipient: settings.isContactRecipient,
        contactLabel,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(profiles.id, profileId));
    return { error: null };
  } catch (err) {
    console.error('updateProfileContactSettings failed:', err);
    return { error: 'Failed to update contact settings' };
  }
}

export async function createProfile(
  username: string,
  email: string,
  role: UserRole,
  password: string,
): Promise<{ error: string | null; user?: { id: string; username: string; role: string; email: string } }> {
  try {
    await requirePermission('manage_users');
  } catch {
    return { error: 'You do not have permission to create users' };
  }

  if (!username.trim()) return { error: 'Username is required' };
  if (!email.trim()) return { error: 'Email is required' };
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters' };

  const validRoles = ['ADMIN', 'EDITOR', 'MEMBER', 'GUEST'];
  if (!validRoles.includes(role)) return { error: 'Invalid role' };

  try {
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email.trim()));
    if (existing.length > 0) return { error: 'A user with that email already exists' };

    const passwordHash = await hash(password, 12);
    const id = uuidv4();
    await db.insert(profiles).values({
      id,
      username: username.trim(),
      email: email.trim(),
      role,
      passwordHash,
      updatedAt: new Date().toISOString(),
    });

    return {
      error: null,
      user: { id, username: username.trim(), role, email: email.trim() },
    };
  } catch (err) {
    console.error('createProfile failed:', err);
    return { error: 'Failed to create user' };
  }
}

export async function deleteProfile(
  profileId: string,
): Promise<{ error: string | null }> {
  try {
    await requirePermission('manage_users');
  } catch {
    return { error: 'You do not have permission to delete users' };
  }

  try {
    await db.delete(profiles).where(eq(profiles.id, profileId));
    return { error: null };
  } catch (err) {
    console.error('deleteProfile failed:', err);
    return { error: 'Failed to delete user' };
  }
}
