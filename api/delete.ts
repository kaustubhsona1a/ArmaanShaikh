import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '6ef17a804311f710ae26039ae53a05d0';
const R2_BUCKET = process.env.R2_BUCKET || 'car-images';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Deletion strictly requires Admin Authentication
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid administrative credentials' });
    }

    const { path } = req.body || {};
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid path' });
    }

    // Path sanitization: Prevent directory traversal
    const cleanPath = path.replace(/\.\./g, '').replace(/^\/+/, '');
    if (!cleanPath) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return res.status(500).json({ error: 'R2 storage credentials not configured' });
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    });

    await s3.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanPath
    }));

    return res.status(200).json({ success: true, deleted: cleanPath });
  } catch (err: any) {
    console.error('[API DELETE ERROR]', err);
    return res.status(500).json({ error: err.message || 'Deletion failed' });
  }
}
