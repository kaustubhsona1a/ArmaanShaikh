import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from './supabase';

const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID || '6ef17a804311f710ae26039ae53a05d0';
const R2_BUCKET = import.meta.env.VITE_R2_BUCKET || 'car-images';
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev';

const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID || '';
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '';

let clientInstance: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }
  return clientInstance;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload an image to Cloudflare R2
 * Tries secure serverless endpoint (/api/upload) first with Supabase Auth token.
 * Falls back to client S3 client if environment variables are provided locally.
 */
export async function uploadToR2(
  file: File | Blob,
  path: string,
  contentType?: string
): Promise<string> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const mimeType = contentType || file.type || 'image/jpeg';

  // Strategy 1: Secure Serverless API Route with Supabase Admin JWT
  try {
    const base64Data = await blobToBase64(file);

    // Retrieve active session token if present
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        path: cleanPath,
        contentType: mimeType,
        base64Data
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return data.url;
      }
    } else {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[R2 SERVERLESS UPLOAD RES ERROR]', res.status, errJson);
    }
  } catch (apiErr) {
    console.debug('[R2 SERVERLESS UPLOAD SKIP]', apiErr);
  }

  // Strategy 2: Direct Client S3 (if client keys are present in .env)
  const s3 = getS3Client();
  if (s3) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanPath,
      Body: uint8Array,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable'
    }));

    return `${R2_PUBLIC_URL}/${cleanPath}`;
  }

  throw new Error('R2 upload unavailable: Serverless endpoint or client keys required');
}

/**
 * Delete an image from Cloudflare R2
 * Authenticated via Supabase Admin JWT to /api/delete
 */
export async function deleteFromR2(path: string): Promise<boolean> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Strategy 1: Secure Serverless API Route with Supabase Admin JWT
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify({ path: cleanPath })
    });

    if (res.ok) {
      return true;
    }
  } catch (apiErr) {
    console.debug('[R2 SERVERLESS DELETE SKIP]', apiErr);
  }

  // Strategy 2: Direct Client S3 fallback
  try {
    const s3 = getS3Client();
    if (!s3) return false;

    await s3.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanPath
    }));
    return true;
  } catch (err) {
    console.warn('[R2 DELETE WARN]', err);
    return false;
  }
}
