import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID || '6ef17a804311f710ae26039ae53a05d0';
const R2_BUCKET = process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET || process.env.VITE_R2_BUCKET || 'car-images';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || 'https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY || process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pgffljamplkthmwahmvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'webp': return 'image/webp';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    default: return 'image/jpeg';
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return res.status(500).json({ 
      error: 'R2 storage credentials missing from environment secrets.',
      help: 'Please ensure R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are added to your Vercel Project Environment Variables.'
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Authenticate Admin session if token provided
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid admin credentials' });
    }
  }

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });

  try {
    // 1. Fetch all vehicle_images pointing to supabase.co
    const { data: pendingImages, error: dbError } = await supabase
      .from('vehicle_images')
      .select('id, vehicle_id, image_url')
      .ilike('image_url', '%supabase.co%');

    if (dbError) {
      return res.status(500).json({ error: 'Failed to query database', details: dbError });
    }

    if (!pendingImages || pendingImages.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All vehicle photos are already 100% on Cloudflare R2!',
        migratedCount: 0,
        totalPending: 0
      });
    }

    console.log(`[R2 SYNC] Found ${pendingImages.length} images pending migration to Cloudflare R2.`);

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (const item of pendingImages) {
      try {
        const sourceUrl = item.image_url;
        // Extract key, e.g. "vehicles/1790249453139_qpvz9bw.jpeg"
        let key = '';
        if (sourceUrl.includes('/vehicle-images/')) {
          key = sourceUrl.split('/vehicle-images/')[1].split('?')[0];
        } else {
          key = `vehicles/${sourceUrl.split('/').pop()}`;
        }

        // Clean leading slashes
        key = key.replace(/^\/+/, '');

        // Fetch image buffer from Supabase Storage
        const fileRes = await fetch(sourceUrl);
        if (!fileRes.ok) {
          throw new Error(`Failed to download from Supabase: HTTP ${fileRes.status}`);
        }

        const buffer = Buffer.from(await fileRes.arrayBuffer());
        const contentType = fileRes.headers.get('content-type') || getContentType(key);

        // Upload to Cloudflare R2
        await r2.send(new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable'
        }));

        const newR2Url = `${R2_PUBLIC_URL}/${key}`;

        // Update database row to point permanently to Cloudflare R2
        const { error: updateError } = await supabase
          .from('vehicle_images')
          .update({ image_url: newR2Url })
          .eq('id', item.id);

        if (updateError) {
          console.warn(`[R2 SYNC DB UPDATE ERROR] for ${item.id}:`, updateError);
        }

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({ id: item.id, url: item.image_url, error: err.message });
      }
    }

    if (successCount > 0) {
      try {
        await supabase
          .from('metadata_versions')
          .upsert({ key: 'vehicles', version: Date.now(), updated_at: new Date().toISOString() }, { onConflict: 'key' });
      } catch {}
    }

    return res.status(200).json({
      success: true,
      migratedCount: successCount,
      failedCount,
      totalPending: pendingImages.length,
      errors: errors.slice(0, 5)
    });
  } catch (err: any) {
    console.error('[R2 SYNC FATAL ERROR]', err);
    return res.status(500).json({ error: err.message || 'R2 sync failed' });
  }
}
