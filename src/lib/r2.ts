import { S3Client } from '@aws-sdk/client-s3';

let _client: S3Client | null = null;

/** When set (e.g. http://127.0.0.1:9000 for MinIO), use this endpoint instead of Cloudflare R2. */
function getS3Endpoint(): string | undefined {
  return process.env.S3_ENDPOINT || process.env.R2_LOCAL_ENDPOINT;
}

export function getR2Client(): S3Client {
  if (_client) return _client;

  const endpoint = getS3Endpoint();
  const isLocal = Boolean(endpoint);

  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? process.env.MINIO_ROOT_USER;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? process.env.MINIO_ROOT_PASSWORD;

  if (!isLocal) {
    const accountId = process.env.R2_ACCOUNT_ID;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
    }
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    return _client;
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('For local S3 (MinIO), set R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY, or MINIO_ROOT_USER + MINIO_ROOT_PASSWORD');
  }

  _client = new S3Client({
    region: 'us-east-1',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return _client;
}

export function getR2BucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('Missing R2_BUCKET_NAME environment variable');
  return bucket;
}

export function getR2PublicUrl(): string {
  const url = process.env.R2_PUBLIC_URL ?? process.env.S3_PUBLIC_URL;
  if (!url) throw new Error('Missing R2_PUBLIC_URL (or S3_PUBLIC_URL for local) environment variable');
  return url.replace(/\/$/, '');
}
