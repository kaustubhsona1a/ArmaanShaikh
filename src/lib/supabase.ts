import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  }
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function deleteImagesFromStorage(items: any[], bucket: string = 'vehicle-images'): Promise<void> {
  if (!items || items.length === 0) return;

  const urls: string[] = [];
  items.forEach(item => {
    if (typeof item === 'string') {
      let cleanItem = item;
      if (item.includes('|||')) {
        cleanItem = item.split('|||')[0];
      }
      urls.push(cleanItem);
    } else if (item && typeof item === 'object') {
      let mainUrl = item.thumbnail_url || item.gallery_url || item.fullscreen_url || item.image_url;
      if (mainUrl) {
        if (typeof mainUrl === 'string' && mainUrl.includes('|||')) {
          mainUrl = mainUrl.split('|||')[0];
        }
        urls.push(mainUrl);
      }
    }
  });

  const paths = urls.map(url => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Look for "/public/bucket_name/" case-insensitively
      const publicIndex = pathname.toLowerCase().indexOf(`/public/${bucket.toLowerCase()}/`);
      if (publicIndex !== -1) {
        const splitStart = publicIndex + `/public/${bucket}/`.length;
        return decodeURIComponent(pathname.substring(splitStart));
      }
      
      // Alternate check for other Supabase URL structures (e.g. without /public/)
      const bucketIndex = pathname.toLowerCase().indexOf(`/${bucket.toLowerCase()}/`);
      if (bucketIndex !== -1) {
        const splitStart = bucketIndex + `/${bucket}/`.length;
        return decodeURIComponent(pathname.substring(splitStart));
      }

      // Fallback for custom domains or different URL formats
      if (url.toLowerCase().includes(bucket.toLowerCase())) {
        const fallbackSplit = url.split(new RegExp(bucket + '/', 'i'));
        if (fallbackSplit.length > 1) {
          return decodeURIComponent(fallbackSplit[1].split('?')[0]);
        }
      }
      return null;
    } catch (e) {
      console.warn('[PATH PARSE ERROR]', e, 'for url:', url);
      return null;
    }
  }).filter(Boolean) as string[];

  console.log(`[STORAGE PURGE] Attempting to delete ${paths.length} items from bucket "${bucket}":`, paths);

  if (paths.length > 0) {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.error(`[STORAGE PURGE ERROR] Failed to delete images from bucket "${bucket}":`, error);
    } else {
      console.log(`[STORAGE PURGE SUCCESS] Deleted from bucket "${bucket}":`, data);
    }
  }
}

export async function cleanupLegacyImageVariants(bucket: string = 'vehicle-images'): Promise<{deletedCount: number, errors: any[]}> {
  let deletedCount = 0;
  const errors: any[] = [];
  try {
    const { data: list, error } = await supabase.storage.from(bucket).list('vehicles', {
      limit: 1000,
      offset: 0,
    });
    if (error) {
      errors.push(error);
      return { deletedCount, errors };
    }

    const filesToDelete = list?.filter(f => 
      f.name.endsWith('-thumb.webp') || 
      f.name.endsWith('-gallery.webp') || 
      f.name.endsWith('-full.webp')
    ).map(f => `vehicles/${f.name}`) || [];

    if (filesToDelete.length > 0) {
      const { data, error: removeError } = await supabase.storage.from(bucket).remove(filesToDelete);
      if (removeError) {
        errors.push(removeError);
      } else {
        deletedCount = data?.length || 0;
      }
    }
  } catch (err) {
    errors.push(err);
  }
  return { deletedCount, errors };
}

/**
 * Fast client-side fallback compression using Canvas if browser-image-compression worker fails
 */
async function fallbackCompressWithCanvas(file: File, maxWidthOrHeight: number = 1440, quality: number = 0.85): Promise<File | Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToStorage(
  file: File, 
  path: string, 
  bucket: string = 'vehicle-images',
  maxRetries: number = 2
): Promise<string> {
  let finalFile: File | Blob = file;
  
  if (file.type.startsWith('image/') && !file.type.includes('svg')) {
    const isShowcase = bucket === 'site_settings' || path.includes('site_settings') || path.includes('logo') || path.includes('hero') || path.includes('about') || path.includes('delivery');
    
    if (!isShowcase) {
      try {
        const options = {
          maxSizeMB: 0.6, // Boundary (~600 KB) for reliable mobile uploads
          maxWidthOrHeight: 1440, // Crisp HD resolution envelope
          useWebWorker: true,
          fileType: 'image/webp' as string,
          initialQuality: 0.85
        };
        finalFile = await imageCompression(file, options);
      } catch (err) {
        console.warn('Worker image compression failed, attempting canvas fallback:', err);
        try {
          finalFile = await fallbackCompressWithCanvas(file, 1440, 0.85);
        } catch (fallbackErr) {
          console.warn('Canvas fallback failed, using original file:', fallbackErr);
          finalFile = file;
        }
      }
    } else {
      console.log('Skipping image compression for showcase asset:', file.name, 'Path:', path, 'Bucket:', bucket);
    }
  }

  const isWebp = finalFile.type === 'image/webp';
  const fileExt = isWebp ? 'webp' : (file.name.split('.').pop()?.toLowerCase() || 'jpg');
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const fileName = `${uniqueId}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, finalFile, {
          cacheControl: '31536000',
          upsert: true,
          contentType: finalFile.type || (isWebp ? 'image/webp' : 'image/jpeg')
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err: any) {
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        console.warn(`[UPLOAD RETRY] Retrying upload for ${file.name} (Attempt ${attempt} of ${maxRetries})...`, err);
        await new Promise(r => setTimeout(r, 600 * attempt));
      }
    }
  }

  console.error(`[UPLOAD FAILED] ${file.name} after ${maxRetries} retries:`, lastError);
  throw lastError || new Error(`Failed to upload ${file.name}`);
}

/**
 * Robust batch uploader with concurrency control and per-image resilience
 */
export async function uploadMultipleImagesToStorage(
  files: File[],
  path: string,
  bucket: string = 'vehicle-images',
  onProgress?: (completed: number, total: number) => void
): Promise<{ successful: string[]; failed: { fileName: string; reason: string }[] }> {
  const successful: string[] = [];
  const failed: { fileName: string; reason: string }[] = [];
  let completedCount = 0;

  // Process sequentially or with concurrency of 2 to protect mobile phone memory and prevent gateway timeouts
  const CONCURRENCY = 2;
  const queue = [...files];

  const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
    while (queue.length > 0) {
      const file = queue.shift();
      if (!file) break;

      try {
        const url = await uploadImageToStorage(file, path, bucket, 2);
        successful.push(url);
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        failed.push({
          fileName: file.name,
          reason: err?.message || 'Network timeout or storage permission error'
        });
      } finally {
        completedCount++;
        if (onProgress) {
          onProgress(completedCount, files.length);
        }
      }
    }
  });

  await Promise.all(workers);

  return { successful, failed };
}


