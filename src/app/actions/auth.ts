'use server';

import { compare, hash } from 'bcryptjs';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  requireAuth,
  isAuthConfigured,
} from '@/lib/auth';
import { sanitizeEmail, validateEmail } from '@/lib/validation';

export async function login(
  email: string,
  password: string,
): Promise<{ error: string | null; user?: { id: string; username: string; role: string; email: string; isContactRecipient: boolean; contactLabel?: string; mustChangePassword: boolean } }> {
  if (!isAuthConfigured()) {
    console.error('Login failed: AUTH_SECRET environment variable is not set');
    return { error: 'Auth is not configured. Please contact the site administrator.' };
  }

  const normalizedEmail = sanitizeEmail(email);
  const emailErr = validateEmail(normalizedEmail);
  if (emailErr) return { error: 'Invalid email or password' };
  if (!password || password.length > 128) return { error: 'Invalid email or password' };

  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail));

    if (rows.length === 0) {
      return { error: 'Invalid email or password' };
    }

    const profile = rows[0];
    if (!profile.passwordHash) {
      return { error: 'Invalid email or password' };
    }

    const valid = await compare(password, profile.passwordHash);
    if (!valid) {
      return { error: 'Invalid email or password' };
    }

    const token = await createSessionToken({
      sub: profile.id,
      role: profile.role,
      username: profile.username,
    });

    await setSessionCookie(token);
    return {
      error: null,
      user: {
        id: profile.id,
        username: profile.username,
        role: profile.role,
        email: profile.email ?? '',
        isContactRecipient: profile.isContactRecipient,
        contactLabel: profile.contactLabel ?? undefined,
        mustChangePassword: profile.mustChangePassword ?? false,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Login failed:', message, err);
    return { error: 'An unexpected error occurred' };
  }
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
}

export async function getCurrentUser(): Promise<{
  id: string;
  username: string;
  role: string;
  email: string;
  isContactRecipient: boolean;
  contactLabel?: string;
  mustChangePassword: boolean;
} | null> {
  const session = await getSession();
  if (!session) return null;

  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      role: profiles.role,
      email: profiles.email,
      isContactRecipient: profiles.isContactRecipient,
      contactLabel: profiles.contactLabel,
      mustChangePassword: profiles.mustChangePassword,
    })
    .from(profiles)
    .where(eq(profiles.id, session.sub));

  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    username: rows[0].username,
    role: rows[0].role,
    email: rows[0].email ?? '',
    isContactRecipient: rows[0].isContactRecipient,
    contactLabel: rows[0].contactLabel ?? undefined,
    mustChangePassword: rows[0].mustChangePassword ?? false,
  };
}

export async function changeOwnPassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ error: string | null }> {
  const { currentPassword, newPassword } = params;
  if (!currentPassword || currentPassword.length > 128) {
    return { error: 'Current password is required.' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.' };
  }
  if (newPassword.length > 128) {
    return { error: 'Password must be 128 characters or fewer.' };
  }

  try {
    const session = await requireAuth();
    const rows = await db
      .select({ id: profiles.id, passwordHash: profiles.passwordHash })
      .from(profiles)
      .where(eq(profiles.id, session.sub));

    if (rows.length === 0) return { error: 'User not found.' };

    const profile = rows[0];
    if (profile.passwordHash) {
      const valid = await compare(currentPassword, profile.passwordHash);
      if (!valid) return { error: 'Current password is incorrect.' };
    }

    const newHash = await hash(newPassword, 12);
    await db
      .update(profiles)
      .set({
        passwordHash: newHash,
        mustChangePassword: false,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(profiles.id, session.sub));

    return { error: null };
  } catch (err) {
    console.error('changeOwnPassword failed:', err);
    return { error: 'An unexpected error occurred.' };
  }
}
