import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://pgffljamplkthmwahmvn.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "6ef17a804311f710ae26039ae53a05d0";
const R2_ACCESS_KEY_ID = process.argv[2] || process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.argv[3] || process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET = process.env.R2_BUCKET || "car-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-f4e7a3fade6e4cc59414305e0c001271.r2.dev";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
});

async function getAllDatabaseImages() {
  console.log("--> Fetching all image records from Supabase database...");
  const allRows = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("vehicle_images")
      .select("id, image_url")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching vehicle_images:", error);
      break;
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Found ${allRows.length} total database image records.`);
  return allRows;
}

async function getAllStorageFiles() {
  console.log("--> Scanning Supabase Storage bucket 'vehicle-images'...");
  const files = [];

  // 1. List vehicles subfolder
  let offset = 0;
  const limit = 100;
  while (true) {
    const { data, error } = await supabase.storage
      .from("vehicle-images")
      .list("vehicles", { limit, offset, sortBy: { column: "name", order: "asc" } });

    if (error || !data || data.length === 0) break;
    for (const item of data) {
      if (item.name && !item.name.startsWith(".")) {
        files.push(`vehicles/${item.name}`);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }

  // 2. List root of bucket
  try {
    const { data: rootItems } = await supabase.storage
      .from("vehicle-images")
      .list("", { limit: 100 });

    if (rootItems) {
      for (const item of rootItems) {
        if (item.name && item.id && !item.name.startsWith(".") && item.name !== "vehicles") {
          files.push(item.name);
        }
      }
    }
  } catch (err) {
    // Ignore root list error
  }

  console.log(`Found ${files.length} physical files in Supabase Storage.`);
  return files;
}

function getContentType(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "webp": return "image/webp";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "gif": return "image/gif";
    case "svg": return "image/svg+xml";
    case "heic": return "image/heic";
    default: return "image/jpeg";
  }
}

async function checkAlreadyExistsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFileToR2(key, attempt = 1) {
  const supabasePublicUrl = `${SUPABASE_URL}/storage/v1/object/public/vehicle-images/${key}`;

  try {
    const res = await fetch(supabasePublicUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from Supabase for ${supabasePublicUrl}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || getContentType(key);

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable"
    }));

    return { success: true, bytes: buffer.length };
  } catch (err) {
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 600 * attempt));
      return uploadFileToR2(key, attempt + 1);
    }
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log("==================================================");
  console.log(" CLOUDFLARE R2 BULK PHOTO MIGRATOR");
  console.log(` Target Bucket: ${R2_BUCKET}`);
  console.log(` Public Domain: ${R2_PUBLIC_URL}`);
  console.log("==================================================\n");

  const [dbRows, storageFiles] = await Promise.all([
    getAllDatabaseImages(),
    getAllStorageFiles()
  ]);

  // Combine unique keys from both DB and Storage list
  const uniqueKeys = new Set();

  for (const file of storageFiles) {
    uniqueKeys.add(file);
  }

  for (const row of dbRows) {
    if (row.image_url && row.image_url.includes("vehicle-images/")) {
      const parts = row.image_url.split("vehicle-images/");
      if (parts[1]) {
        const cleanKey = parts[1].split("?")[0];
        uniqueKeys.add(cleanKey);
      }
    }
  }

  const allKeys = Array.from(uniqueKeys);
  console.log(`\nReady to migrate ${allKeys.length} total unique images directly into R2.`);

  let completed = 0;
  let skipped = 0;
  let failed = 0;
  let totalBytes = 0;

  const CONCURRENCY = 15;
  const queue = [...allKeys];

  async function worker(workerId) {
    while (queue.length > 0) {
      const key = queue.shift();
      if (!key) break;

      // Check if already in R2
      const exists = await checkAlreadyExistsInR2(key);
      if (exists) {
        skipped++;
        completed++;
        
        // Ensure database points to R2
        const r2Url = `${R2_PUBLIC_URL}/${key}`;
        await supabase
          .from("vehicle_images")
          .update({ image_url: r2Url })
          .ilike("image_url", `%${key}%`);

        if (completed % 50 === 0 || completed === allKeys.length) {
          console.log(`[Progress: ${completed}/${allKeys.length} (${((completed/allKeys.length)*100).toFixed(1)}%)] (Worker ${workerId}) Confirmed existing in R2 & Synced DB: ${key}`);
        }
        continue;
      }

      const result = await uploadFileToR2(key);
      completed++;

      if (result.success) {
        totalBytes += result.bytes;
        
        // Update database row to point to R2
        const r2Url = `${R2_PUBLIC_URL}/${key}`;
        await supabase
          .from("vehicle_images")
          .update({ image_url: r2Url })
          .ilike("image_url", `%${key}%`);

        if (completed % 25 === 0 || completed === allKeys.length) {
          const mb = (totalBytes / (1024 * 1024)).toFixed(1);
          console.log(`[Progress: ${completed}/${allKeys.length} (${((completed/allKeys.length)*100).toFixed(1)}%)] Transferred ~${mb} MB (Last: ${key})`);
        }
      } else {
        failed++;
        console.error(`[FAILED] Key: ${key} -> ${result.error}`);
      }
    }
  }

  console.log(`Starting ${CONCURRENCY} parallel transfer streams...\n`);
  const startTime = Date.now();
  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  // Migrate any base64 data: URLs in vehicle_images to R2
  const dataUrlRows = dbRows.filter(row => row.image_url && row.image_url.startsWith("data:"));
  if (dataUrlRows.length > 0) {
    console.log(`\n--> Migrating ${dataUrlRows.length} embedded base64 data URLs into R2...`);
    let dataUrlMigrated = 0;
    for (const row of dataUrlRows) {
      try {
        const matches = row.image_url.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) continue;
        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "jpg";
        const key = `vehicles/migrated_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const buffer = Buffer.from(base64Data, "base64");

        await r2.send(new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          CacheControl: "public, max-age=31536000, immutable"
        }));

        const r2Url = `${R2_PUBLIC_URL}/${key}`;
        await supabase
          .from("vehicle_images")
          .update({ image_url: r2Url })
          .eq("id", row.id);

        dataUrlMigrated++;
        totalBytes += buffer.length;
        if (dataUrlMigrated % 10 === 0 || dataUrlMigrated === dataUrlRows.length) {
          console.log(`[Data URLs: ${dataUrlMigrated}/${dataUrlRows.length}] Uploaded & Updated: ${r2Url}`);
        }
      } catch (err) {
        console.error(`Failed migrating data URL row ${row.id}:`, err.message);
      }
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  console.log("\n==================================================");
  console.log(" MIGRATION SUMMARY");
  console.log(` Total storage keys processed: ${completed}`);
  console.log(` Newly uploaded to R2: ${completed - skipped - failed}`);
  console.log(` Already in R2: ${skipped}`);
  console.log(` Data URLs migrated: ${dataUrlRows.length}`);
  console.log(` Failed: ${failed}`);
  console.log(` Total Data Transferred: ${totalMB} MB`);
  console.log(` Total Time: ${durationSec} seconds`);
  console.log("==================================================");
}

main().catch(console.error);
