'use server';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { requirePermission } from '@/lib/rbac';
import { requestPasswordReset } from '@/app/actions/passwordReset';
import type { UserRole } from '@/types';
import { sanitizeString, sanitizeEmail, sanitizeSingleLine, validateEmail, validateRequired, validatePassword } from '@/lib/validation';

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
    const rawLabel = settings.isContactRecipient ? settings.contactLabel : null;
    const contactLabel = rawLabel ? sanitizeSingleLine(rawLabel, 80) || null : null;
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

  const cleanUsername = sanitizeString(username, 80);
  const cleanEmail = sanitizeEmail(email);

  const nameErr = validateRequired(cleanUsername, 'Username');
  if (nameErr) return { error: nameErr };
  const emailErr = validateEmail(cleanEmail);
  if (emailErr) return { error: emailErr };
  const pwErr = validatePassword(password);
  if (pwErr) return { error: pwErr };

  const validRoles = ['ADMIN', 'EDITOR', 'MEMBER', 'GUEST'];
  if (!validRoles.includes(role)) return { error: 'Invalid role' };

  try {
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, cleanEmail));
    if (existing.length > 0) return { error: 'A user with that email already exists' };

    const passwordHash = await hash(password, 12);
    const id = uuidv4();
    await db.insert(profiles).values({
      id,
      username: cleanUsername,
      email: cleanEmail,
      role,
      passwordHash,
      updatedAt: new Date().toISOString(),
    });

    return {
      error: null,
      user: { id, username: cleanUsername, role, email: cleanEmail },
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

function generateTemporaryPassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export async function adminSendPasswordReset(
  profileId: string,
): Promise<{ error: string | null }> {
  try {
    await requirePermission('manage_users');
  } catch {
    return { error: 'You do not have permission to manage users' };
  }

  try {
    const rows = await db
      .select({ email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, profileId));

    if (rows.length === 0) return { error: 'User not found' };

    const email = rows[0].email;
    if (!email) return { error: 'User has no email address' };

    return requestPasswordReset(email);
  } catch (err) {
    console.error('adminSendPasswordReset failed:', err);
    return { error: 'Failed to send reset email' };
  }
}

export async function adminSetTemporaryPassword(
  profileId: string,
): Promise<{ error: string | null; tempPassword?: string }> {
  try {
    await requirePermission('manage_users');
  } catch {
    return { error: 'You do not have permission to manage users' };
  }

  try {
    const rows = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, profileId));

    if (rows.length === 0) return { error: 'User not found' };

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hash(tempPassword, 12);

    await db
      .update(profiles)
      .set({
        passwordHash,
        mustChangePassword: true,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(profiles.id, profileId));

    return { error: null, tempPassword };
  } catch (err) {
    console.error('adminSetTemporaryPassword failed:', err);
    return { error: 'Failed to set temporary password' };
  }
}
