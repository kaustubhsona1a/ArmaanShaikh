import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = '6ef17a804311f710ae26039ae53a05d0';
const R2_BUCKET = 'car-images';
const R2_PUBLIC_URL = 'https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: '683026edb67ca029c3a214d844f7bfe4',
    secretAccessKey: 'b67c25db0812fd6e7b3ec19cf8ef97d40256b04ad884fbd06a44b2b40dd0a278'
  }
});

export async function uploadToR2(
  file: File | Blob,
  path: string,
  contentType?: string
): Promise<string> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: cleanPath,
    Body: uint8Array,
    ContentType: contentType || file.type || 'image/jpeg',
    CacheControl: 'public, max-age=31536000, immutable'
  }));

  return `${R2_PUBLIC_URL}/${cleanPath}`;
}

export async function deleteFromR2(path: string): Promise<boolean> {
  try {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    await r2Client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanPath
    }));
    return true;
  } catch (err) {
    console.warn('[R2 DELETE WARN]', err);
    return false;
  }
}
