'use server';

import { createClient } from '@/lib/supabase/server';

const BUCKET = 'cms-uploads';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function uploadImage(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get('file') as File | null;
  if (!file || !file.size) return { url: null, error: 'No file provided' };
  if (file.size > MAX_SIZE) return { url: null, error: 'File too large (max 5MB)' };
  if (!ALLOWED.includes(file.type)) return { url: null, error: 'Invalid type (use JPEG, PNG, GIF, or WebP)' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: 'Not authenticated' };

  const ext = file.name.split('.').pop() || 'jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = `images/${name}`;

  const buf = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { url: null, error: error.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: urlData.publicUrl, error: null };
}
