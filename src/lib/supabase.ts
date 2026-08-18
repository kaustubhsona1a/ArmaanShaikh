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

export async function uploadImageToStorage(file: File, path: string, bucket: string = 'vehicle-images'): Promise<string> {
  let finalFile = file;
  
  if (file.type.startsWith('image/') && !file.type.includes('svg')) {
    const isShowcase = bucket === 'site_settings' || path.includes('site_settings') || path.includes('logo') || path.includes('hero') || path.includes('about') || path.includes('delivery');
    
    if (!isShowcase) {
      try {
        const options = {
          maxSizeMB: 0.5, // Budget thumbnail boundary (~500 KB) requested by user
          maxWidthOrHeight: 1440, // Crisp HD resolution envelope for pristine sharpness
          useWebWorker: true,
          fileType: 'image/webp' as string, // WebP is key to delivering high resolution & sharpness at ~500 KB
          initialQuality: 0.88 // Sharp baseline quality
        };
        finalFile = await imageCompression(file, options);
      } catch (err) {
        console.warn('Image compression failed, using original', err);
      }
    } else {
      console.log('Skipping image compression for showcase asset:', file.name, 'Path:', path, 'Bucket:', bucket);
    }
  }

  const fileExt = finalFile.type === 'image/webp' ? 'webp' : (finalFile.name.split('.').pop() || 'jpg');
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, finalFile);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

