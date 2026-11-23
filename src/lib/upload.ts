import { requestUploadUrl } from '@/app/actions/r2-upload';

type UploadFolder = 'images' | 'recordings' | 'documents' | 'videos';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Some browsers (e.g. Windows, some Android) leave File.type empty for .mov etc.
const EXTENSION_TYPES: Record<string, string> = {
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  mp4: 'video/mp4',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[ext] ?? 'application/octet-stream';
}

export async function uploadToR2(
  file: File,
  folder: UploadFolder,
): Promise<{ url: string; fileSize: string; error: null } | { url: null; fileSize: null; error: string }> {
  const ticket = await requestUploadUrl(file.name, resolveContentType(file), file.size, folder);

  if (ticket.error || !ticket.uploadUrl || !ticket.publicUrl) {
    return { url: null, fileSize: null, error: ticket.error ?? 'No upload URL returned' };
  }

  try {
    const response = await fetch(ticket.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': ticket.contentType },
    });

    if (!response.ok) {
      return { url: null, fileSize: null, error: `Upload failed (HTTP ${response.status})` };
    }

    return {
      url: ticket.publicUrl,
      fileSize: formatFileSize(file.size),
      error: null,
    };
  } catch {
    return {
      url: null,
      fileSize: null,
      error: 'Upload was blocked by the storage server. An admin needs to allow this website in the R2 bucket CORS settings (see docs/CLOUD_SETUP.md).',
    };
  }
}
