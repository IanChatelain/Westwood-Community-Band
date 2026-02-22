'use server';

import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types';

export async function updateProfileRole(profileId: string, newRole: UserRole): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!callerProfile || callerProfile.role !== 'ADMIN') return { error: 'Only admins can change roles' };

  const validRoles = ['ADMIN', 'EDITOR', 'MEMBER', 'GUEST'];
  if (!validRoles.includes(newRole)) return { error: 'Invalid role' };

  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
  return { error: error?.message ?? null };
}
