'use server';

import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getR2BucketName, getR2PublicUrl } from '@/lib/r2';
import { requireAuth } from '@/lib/auth';

/**
 * Deletes an object from R2 by its key.
 * Requires auth. Idempotent (no error if object does not exist).
 */
export async function deleteR2Object(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
  } catch {
    return { success: false, error: 'Not authenticated' };
  }

  if (!key || typeof key !== 'string' || key.trim() === '') {
    return { success: false, error: 'Invalid key' };
  }

  const client = getR2Client();
  const bucket = getR2BucketName();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // 404 / NoSuchKey is fine - object already gone
    if (String(message).toLowerCase().includes('nosuchkey') || String(message).includes('404')) {
      return { success: true };
    }
    console.error('[r2-delete] Failed to delete', key, err);
    return { success: false, error: message };
  }
}

/**
 * Derives R2 key from a public URL and deletes the object if the URL is under our R2 base.
 * Skips external URLs (YouTube, etc.) without error.
 */
export async function deleteR2ObjectByUrl(url: string): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    await requireAuth();
  } catch {
    return { success: false, error: 'Not authenticated' };
  }

  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { success: true, skipped: true };
  }

  const base = getR2PublicUrl().replace(/\/$/, '');
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith(base + '/') && cleanUrl !== base) {
    return { success: true, skipped: true }; // External URL, nothing to delete
  }

  const key = cleanUrl.slice(base.length).replace(/^\//, '');
  const result = await deleteR2Object(key);
  return result.success ? { success: true } : { success: false, error: result.error };
}
