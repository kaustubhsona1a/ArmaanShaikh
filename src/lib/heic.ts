/**
 * Universal Apple HEIC / HEIF to JPEG Client-Side Converter
 * Converts photos taken on iPhones, iPads, Macs, and modern Android devices
 * to universally compatible high-definition JPEG files directly in the browser.
 */

export async function isHeicBlob(blob: Blob | File): Promise<boolean> {
  if (!blob) return false;

  // 1. Check MIME type
  const mime = (blob.type || '').toLowerCase();
  if (mime.includes('heic') || mime.includes('heif')) {
    return true;
  }

  // 2. Check filename extension if File
  if ('name' in blob && typeof (blob as File).name === 'string') {
    if (/\.(heic|heif)$/i.test((blob as File).name)) {
      return true;
    }
  }

  // 3. Inspect ISO Base Media File Format magic bytes (FTYP box)
  try {
    const slice = blob.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const arr = new Uint8Array(buffer);
    if (arr.length >= 12) {
      const ftyp = String.fromCharCode(arr[4], arr[5], arr[6], arr[7]);
      if (ftyp === 'ftyp') {
        const brand = String.fromCharCode(arr[8], arr[9], arr[10], arr[11]).toLowerCase();
        if (['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) {
          return true;
        }
      }
    }
  } catch {
    // Ignore buffer read errors
  }

  return false;
}

/**
 * Converts a HEIC/HEIF file into a standard JPEG File.
 * If the file is not HEIC, it returns the original file untouched.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const isHeic = await isHeicBlob(file);
  if (!isHeic) {
    return file;
  }

  try {
    // Dynamically load heic2any WebAssembly engine in the browser
    const heic2anyModule = await import('heic2any');
    const heic2any = (heic2anyModule.default || heic2anyModule) as (options: any) => Promise<Blob | Blob[]>;

    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.90
    });

    const singleBlob = Array.isArray(converted) ? converted[0] : converted;
    const baseName = file.name ? file.name.replace(/\.(heic|heif)$/i, '') : `photo_${Date.now()}`;
    const newName = `${baseName}.jpg`;

    return new File([singleBlob], newName, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
  } catch (err) {
    console.warn('[HEIC CONVERSION] heic2any client conversion error, proceeding with original:', err);
    return file;
  }
}

/**
 * Preprocesses an array of files, converting any HEIC/HEIF photos to JPEG in parallel
 */
export async function processUploadFiles(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<File[]> {
  const processed: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (await isHeicBlob(file)) {
      if (onProgress) onProgress(i + 1, files.length);
      const converted = await convertHeicToJpeg(file);
      processed.push(converted);
    } else {
      processed.push(file);
    }
  }

  return processed;
}
