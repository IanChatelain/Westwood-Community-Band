'use server';

import crypto from 'crypto';
import { hash } from 'bcryptjs';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '@/lib/email';
import { sanitizeEmail, validateEmail, validatePassword } from '@/lib/validation';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function getBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function requestPasswordReset(
  email: string,
): Promise<{ error: string | null }> {
  const normalised = sanitizeEmail(email);
  if (!normalised || validateEmail(normalised)) return { error: null };

  try {
    const rows = await db
      .select({ id: profiles.id, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.email, normalised));

    if (rows.length === 0) return { error: null }; // don't leak existence

    const profile = rows[0];
    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

    await db
      .update(profiles)
      .set({
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(profiles.id, profile.id));

    const resetUrl = `${getBaseUrl()}/reset-password/confirm?email=${encodeURIComponent(normalised)}&token=${encodeURIComponent(rawToken)}`;
    await sendPasswordResetEmail({ to: normalised, resetUrl });

    return { error: null };
  } catch (err) {
    console.error('requestPasswordReset failed:', err);
    return { error: null }; // still don't leak info
  }
}

export async function resetPassword(params: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<{ error: string | null }> {
  const { email, token, newPassword } = params;
  const normalised = sanitizeEmail(email);

  if (!normalised || !token || !newPassword) {
    return { error: 'Missing required fields.' };
  }
  const emailErr = validateEmail(normalised);
  if (emailErr) return { error: 'Invalid or expired reset link.' };
  const pwErr = validatePassword(newPassword);
  if (pwErr) return { error: pwErr };

  try {
    const rows = await db
      .select({
        id: profiles.id,
        passwordResetTokenHash: profiles.passwordResetTokenHash,
        passwordResetTokenExpiresAt: profiles.passwordResetTokenExpiresAt,
      })
      .from(profiles)
      .where(eq(profiles.email, normalised));

    if (rows.length === 0) {
      return { error: 'Invalid or expired reset link.' };
    }

    const profile = rows[0];
    if (!profile.passwordResetTokenHash || !profile.passwordResetTokenExpiresAt) {
      return { error: 'Invalid or expired reset link.' };
    }

    if (new Date(profile.passwordResetTokenExpiresAt) < new Date()) {
      return { error: 'This reset link has expired. Please request a new one.' };
    }

    const incomingHash = hashToken(token);
    if (!safeEquals(incomingHash, profile.passwordResetTokenHash)) {
      return { error: 'Invalid or expired reset link.' };
    }

    const passwordHash = await hash(newPassword, 12);
    await db
      .update(profiles)
      .set({
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(profiles.id, profile.id));

    return { error: null };
  } catch (err) {
    console.error('resetPassword failed:', err);
    return { error: 'An unexpected error occurred.' };
  }
}
