import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '6ef17a804311f710ae26039ae53a05d0';
const R2_BUCKET = process.env.R2_BUCKET || 'car-images';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Rate limiting in-memory map for unauthenticated lead photo uploads (prevents storage DOS attacks)
const ipUploadCounts = new Map<string, { count: number; resetTime: number }>();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
]);

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB limit per compressed image

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return res.status(500).json({ error: 'R2 storage credentials not configured in environment' });
  }

  try {
    const { path, contentType, base64Data } = req.body || {};

    if (!path || !base64Data || typeof path !== 'string' || typeof base64Data !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    // Path sanitization: Prevent directory traversal
    const cleanPath = path.replace(/\.\./g, '').replace(/^\/+/, '');
    if (!cleanPath) {
      return res.status(400).json({ error: 'Invalid path format' });
    }

    // Validate MIME type against whitelist
    const safeContentType = contentType?.toLowerCase() || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.has(safeContentType)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WebP images are permitted.' });
    }

    // Decode and validate file size
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'Payload too large. Maximum size is 6MB.' });
    }

    // Determine authorization level based on target directory
    const isLeadUpload = cleanPath.startsWith('leads/');

    if (!isLeadUpload) {
      // Admin Upload (vehicles/, site/, etc.) - Must be an authenticated admin
      const authHeader = req.headers.authorization || req.headers.Authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Authentication token required for inventory uploads' });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid admin session' });
      }
    } else {
      // Lead upload from public "Sell Your Car" page - Apply rate-limiting per IP
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
      const now = Date.now();
      const userLimit = ipUploadCounts.get(clientIp);

      if (userLimit && now < userLimit.resetTime) {
        if (userLimit.count >= 20) {
          return res.status(429).json({ error: 'Too many uploads. Please wait 10 minutes.' });
        }
        userLimit.count += 1;
      } else {
        ipUploadCounts.set(clientIp, { count: 1, resetTime: now + 10 * 60 * 1000 });
      }
    }

    // Perform upload to Cloudflare R2
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    });

    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanPath,
      Body: buffer,
      ContentType: safeContentType,
      CacheControl: 'public, max-age=31536000, immutable'
    }));

    const url = `${R2_PUBLIC_URL}/${cleanPath}`;
    return res.status(200).json({ success: true, url });
  } catch (err: any) {
    console.error('[API UPLOAD ERROR]', err);
    return res.status(500).json({ error: err.message || 'Upload execution failed' });
  }
}
