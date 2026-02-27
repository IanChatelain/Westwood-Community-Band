'use server';

import { createClient } from '@/lib/supabase/server';

const BUCKET = 'cms-uploads';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_RECORDING_SIZE = 50 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/html',
  'text/plain',
  'text/csv',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function authenticatedUpload(
  file: File,
  folder: string,
): Promise<{ url: string; error: null } | { url: null; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: 'Not authenticated' };

  const ext = file.name.split('.').pop() || 'bin';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = `${folder}/${name}`;

  const buf = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { url: null, error: error.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: urlData.publicUrl, error: null };
}

export async function uploadImage(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get('file') as File | null;
  if (!file || !file.size) return { url: null, error: 'No file provided' };
  if (file.size > MAX_IMAGE_SIZE) return { url: null, error: 'File too large (max 5MB)' };
  if (!IMAGE_TYPES.includes(file.type)) return { url: null, error: 'Invalid type (use JPEG, PNG, GIF, or WebP)' };

  return authenticatedUpload(file, 'images');
}

export async function uploadRecording(
  formData: FormData,
): Promise<{ url: string | null; fileSize: string | null; error: string | null }> {
  const file = formData.get('file') as File | null;
  if (!file || !file.size) return { url: null, fileSize: null, error: 'No file provided' };
  if (file.size > MAX_RECORDING_SIZE) return { url: null, fileSize: null, error: 'File too large (max 50MB)' };
  if (!AUDIO_TYPES.includes(file.type)) return { url: null, fileSize: null, error: 'Invalid audio type' };

  const result = await authenticatedUpload(file, 'recordings');
  if (result.error) return { url: null, fileSize: null, error: result.error };

  return { url: result.url, fileSize: formatFileSize(file.size), error: null };
}

export async function uploadDocument(
  formData: FormData,
): Promise<{ url: string | null; fileSize: string | null; error: string | null }> {
  const file = formData.get('file') as File | null;
  if (!file || !file.size) return { url: null, fileSize: null, error: 'No file provided' };
  if (file.size > MAX_DOCUMENT_SIZE) return { url: null, fileSize: null, error: 'File too large (max 20MB)' };
  if (!DOCUMENT_TYPES.includes(file.type)) return { url: null, fileSize: null, error: 'Invalid document type' };

  const result = await authenticatedUpload(file, 'documents');
  if (result.error) return { url: null, fileSize: null, error: result.error };

  return { url: result.url, fileSize: formatFileSize(file.size), error: null };
}
