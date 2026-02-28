'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getR2BucketName, getR2PublicUrl } from '@/lib/r2';
import { requireAuth } from '@/lib/auth';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_RECORDING_SIZE = 50 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 250 * 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
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

type UploadFolder = 'images' | 'recordings' | 'documents' | 'videos';

const FOLDER_CONFIG: Record<UploadFolder, { allowedTypes: string[]; maxSize: number; sizeLabel: string }> = {
  images: { allowedTypes: IMAGE_TYPES, maxSize: MAX_IMAGE_SIZE, sizeLabel: '5MB' },
  recordings: { allowedTypes: AUDIO_TYPES, maxSize: MAX_RECORDING_SIZE, sizeLabel: '50MB' },
  documents: { allowedTypes: DOCUMENT_TYPES, maxSize: MAX_DOCUMENT_SIZE, sizeLabel: '20MB' },
  videos: { allowedTypes: VIDEO_TYPES, maxSize: MAX_VIDEO_SIZE, sizeLabel: '250MB' },
};

export async function requestUploadUrl(
  filename: string,
  contentType: string,
  fileSize: number,
  folder: UploadFolder,
): Promise<{ uploadUrl: string; publicUrl: string; key: string; error: null } | { uploadUrl: null; publicUrl: null; key: null; error: string }> {
  try {
    await requireAuth();
  } catch {
    return { uploadUrl: null, publicUrl: null, key: null, error: 'Not authenticated' };
  }

  const config = FOLDER_CONFIG[folder];
  if (!config) {
    return { uploadUrl: null, publicUrl: null, key: null, error: 'Invalid upload folder' };
  }

  if (!config.allowedTypes.includes(contentType)) {
    return { uploadUrl: null, publicUrl: null, key: null, error: `Invalid file type for ${folder}` };
  }

  if (fileSize > config.maxSize) {
    return { uploadUrl: null, publicUrl: null, key: null, error: `File too large (max ${config.sizeLabel})` };
  }

  const ext = filename.split('.').pop() || 'bin';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const key = `${folder}/${uniqueName}`;

  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const publicUrl = `${getR2PublicUrl()}/${key}`;

  return { uploadUrl, publicUrl, key, error: null };
}
