'use server';

import { compare } from 'bcryptjs';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from '@/lib/auth';

export async function login(
  email: string,
  password: string,
): Promise<{ error: string | null; user?: { id: string; username: string; role: string; email: string } }> {
  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email));

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
      },
    };
  } catch (err) {
    console.error('Login failed:', err);
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
} | null> {
  const session = await getSession();
  if (!session) return null;

  const rows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      role: profiles.role,
      email: profiles.email,
    })
    .from(profiles)
    .where(eq(profiles.id, session.sub));

  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    username: rows[0].username,
    role: rows[0].role,
    email: rows[0].email ?? '',
  };
}
