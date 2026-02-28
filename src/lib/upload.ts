import { requestUploadUrl } from '@/app/actions/r2-upload';

type UploadFolder = 'images' | 'recordings' | 'documents' | 'videos';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function uploadToR2(
  file: File,
  folder: UploadFolder,
): Promise<{ url: string; fileSize: string; error: null } | { url: null; fileSize: null; error: string }> {
  const ticket = await requestUploadUrl(file.name, file.type, file.size, folder);

  if (ticket.error || !ticket.uploadUrl || !ticket.publicUrl) {
    return { url: null, fileSize: null, error: ticket.error ?? 'No upload URL returned' };
  }

  try {
    const response = await fetch(ticket.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
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
    return { url: null, fileSize: null, error: 'Network error during upload' };
  }
}
