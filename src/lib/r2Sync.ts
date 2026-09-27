import { supabase } from './supabase';
import { uploadToR2 } from './r2';

export interface R2SyncProgress {
  current: number;
  total: number;
  currentCar?: string;
  isComplete: boolean;
  successCount: number;
  failedCount: number;
}

/**
 * Scans vehicle_images for any legacy Supabase storage links or inline data: URLs
 * and converts them to permanent Cloudflare R2 links.
 * Runs in the authenticated admin browser session to guarantee RLS permissions.
 */
export async function syncPendingImagesToR2(
  onProgress?: (progress: R2SyncProgress) => void
): Promise<{ success: boolean; migratedCount: number; failedCount: number }> {
  try {
    // 1. Query pending images
    const { data: supabaseRows, error: e1 } = await supabase
      .from('vehicle_images')
      .select('id, vehicle_id, image_url, display_order')
      .ilike('image_url', '%supabase.co%');

    const { data: dataUrlRows, error: e2 } = await supabase
      .from('vehicle_images')
      .select('id, vehicle_id, image_url, display_order')
      .like('image_url', 'data:%');

    if (e1 || e2) {
      console.error('[R2 SYNC] Error querying pending images:', e1 || e2);
      return { success: false, migratedCount: 0, failedCount: 0 };
    }

    const allPending = [...(supabaseRows || []), ...(dataUrlRows || [])];
    const total = allPending.length;

    if (total === 0) {
      if (onProgress) {
        onProgress({ current: 0, total: 0, isComplete: true, successCount: 0, failedCount: 0 });
      }
      return { success: true, migratedCount: 0, failedCount: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < total; i++) {
      const item = allPending[i];

      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          isComplete: false,
          successCount,
          failedCount
        });
      }

      try {
        let r2Url = '';

        if (item.image_url.includes('supabase.co')) {
          // The file is already mirrored in R2, generate the direct public URL
          r2Url = item.image_url.replace(
            /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/vehicle-images\//g,
            'https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev/'
          );
        } else if (item.image_url.startsWith('data:')) {
          // Decode data URL and upload to R2
          const res = await fetch(item.image_url);
          const blob = await res.blob();
          const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
          const filePath = `vehicles/${item.vehicle_id}_${item.display_order || 0}_${Date.now()}.${ext}`;

          r2Url = await uploadToR2(blob, filePath, blob.type);
        }

        if (r2Url) {
          const { error: updateErr } = await supabase
            .from('vehicle_images')
            .update({ image_url: r2Url })
            .eq('id', item.id);

          if (updateErr) {
            console.warn(`[R2 SYNC] DB update error for ${item.id}:`, updateErr);
            failedCount++;
          } else {
            successCount++;
          }
        } else {
          failedCount++;
        }
      } catch (itemErr) {
        console.error(`[R2 SYNC] Error processing item ${item.id}:`, itemErr);
        failedCount++;
      }
    }

    // Refresh versioning timestamp so all clients revalidate
    if (successCount > 0) {
      try {
        await supabase
          .from('metadata_versions')
          .upsert({ key: 'vehicles', version: Date.now(), updated_at: new Date().toISOString() }, { onConflict: 'key' });
      } catch {}
    }

    if (onProgress) {
      onProgress({
        current: total,
        total,
        isComplete: true,
        successCount,
        failedCount
      });
    }

    return { success: true, migratedCount: successCount, failedCount };
  } catch (err) {
    console.error('[R2 SYNC FATAL]', err);
    return { success: false, migratedCount: 0, failedCount: 0 };
  }
}
