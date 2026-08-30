import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Vehicle, MOCK_VEHICLES, MOCK_LEADS } from '../data/mockData';
import { supabase, handleSupabaseError, OperationType, deleteImagesFromStorage } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getFromCache, saveToCache } from '../lib/indexedDB';
import { resolveImageUrl } from '../lib/imageCache';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  car: string;
  status: string;
  date: string;
  images?: string[];
}

export interface SiteConfig {
  id?: string;
  aboutImage: string;
  homeHeroImage: string;
  homeHeroMobileImage?: string;
  homeHeroVideo?: string;
  homeHeroMobileVideo?: string;
  homeHeroType?: 'video' | 'image';
  logo: string;
  clientDeliveries?: string[];
  instagramReels?: string[];
}

export interface DiagnosticMetrics {
  supabaseReads: number;
  supabaseWrites: number;
  cacheHits: number;
  cacheMisses: number;
  metaMatches: number;
  metaMismatches: number;
  indexedDbLoads: number;
  indexedDbSaves: number;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  leads: Lead[];
  siteConfig: SiteConfig;
  loading: boolean;
  addVehicle: (vehicle: Vehicle) => Promise<void>;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'date' | 'status'>) => Promise<void>;
  updateLeadStatus: (id: string, status: string) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  updateSiteConfig: (updates: Partial<SiteConfig>) => Promise<void>;
  migrateLocalStorage: () => Promise<boolean>;
  seedSampleData: () => Promise<boolean>;
  metrics: DiagnosticMetrics;
  refreshInventory: (bypassCache?: boolean) => Promise<void>;
  fetchLeads?: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

const DEFAULT_CONFIG: SiteConfig = {
  aboutImage: '/about.jpg',
  homeHeroImage: '/hero-laptop.png',
  homeHeroMobileImage: '/hero-mobile.png',
  homeHeroVideo: '',
  homeHeroMobileVideo: '',
  homeHeroType: 'image',
  logo: '/logo.png',
  clientDeliveries: [],
  instagramReels: []
};

export function sanitizeHeroImage(path: string | undefined): string {
  const resolved = resolveImageUrl(path);
  if (!resolved || resolved === '/backdrop.jpg' || resolved === '/hero-desktop.jpg' || resolved.endsWith('/hero-desktop.jpg') || resolved.endsWith('/backdrop.jpg')) {
    return "/hero-laptop.png";
  }
  return resolved;
}

export function sanitizeHeroMobileImage(path: string | undefined): string {
  const resolved = resolveImageUrl(path);
  if (!resolved || resolved === '/hero-mobile.jpg' || resolved.endsWith('/hero-mobile.jpg')) {
    return "/hero-mobile.png";
  }
  return resolved;
}

export function sanitizeLogo(path: string | undefined): string {
  const resolved = resolveImageUrl(path);
  if (!resolved || resolved === '/bombay_logo.jpeg' || resolved === '/logo.jpeg' || resolved.endsWith('/bombay_logo.jpeg') || resolved.endsWith('/logo.jpeg') || resolved.includes('bombay_logo')) {
    return "/logo.png";
  }
  return resolved;
}

export function sanitizeAboutImage(path: string | undefined): string {
  const resolved = resolveImageUrl(path);
  if (!resolved) {
    return "/about.jpg";
  }
  return resolved;
}

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON;
  const isConfigured = Boolean(
    url &&
    url !== 'YOUR_SUPABASE_URL' &&
    !url.includes('placeholder.supabase.co') &&
    key &&
    key !== 'YOUR_SUPABASE_ANON_KEY' &&
    key !== 'placeholder'
  );
  return isConfigured;
};

// Helper to guarantee a valid UUID format. If ID is already a UUID, returns it.
// If not (e.g. mock IDs like 'porsche_911' or custom list IDs like 'v17123121'),
// it deterministically converts the string into a valid UUID.
export function ensureUUID(id: string): string {
  if (!id) {
    return '00000000-0000-4000-8000-000000000000';
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id.toLowerCase();
  }

  // Generate a deterministic hash from the string to build a valid UUID
  let h1 = 0x811c9dc5;
  let h2 = 0x343f119e;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 0x01000193);
    h2 = Math.imul(h2 ^ char, 0x01000193);
  }
  
  const s1 = (Math.abs(h1) >>> 0).toString(16).padStart(8, '0');
  const s2 = (Math.abs(h2) >>> 0).toString(16).padStart(8, '0');
  const s3 = (Math.abs(h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const s4 = (Math.abs(h1 & h2) >>> 0).toString(16).padStart(8, '0');
  
  const hex = (s1 + s2 + s3 + s4).substring(0, 32);
  
  const part1 = hex.slice(0, 8);
  const part2 = hex.slice(8, 12);
  const part3 = '4' + hex.slice(13, 16); 
  const part4 = '8' + hex.slice(17, 20); 
  const part5 = hex.slice(20, 32);
  
  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
}

// Convert a vehicle object into a database payload matching schema.sql's columns exactly
export function toDbPayload(v: any) {
  const reelVal = v.instagramReel || v.instagram_reel || null;
  return {
    id: ensureUUID(v.id),
    make: v.make || '',
    model: v.model || '',
    variant: v.variant || null,
    year: typeof v.year === 'number' ? v.year : Number(v.year || new Date().getFullYear()),
    price: typeof v.price === 'number' ? v.price : Number(v.price || 0),
    mileage: typeof v.mileage === 'number' ? v.mileage : Number(v.mileage || 0),
    fuel_type: v.fuelType || v.fuel_type || 'Petrol',
    transmission: v.transmission || 'Automatic',
    body_type: v.bodyType || v.body_type || 'SUV',
    engine: v.engine || null,
    color: v.color || null,
    ownership: v.ownership || null,
    registration: v.registration || null,
    status: v.status || 'Available',
    featured: v.featured !== undefined ? v.featured : false,
    description: v.description || null,
    instagram_reel: reelVal,
    inspection_notes: v.inspection_notes || v.inspectionNotes || null,
    images: Array.isArray(v.images) ? v.images : [],
    features: Array.isArray(v.features) ? (
      reelVal ? [...v.features.filter((f: string) => !f.startsWith('instagram_reel:')), `instagram_reel:${reelVal}`] : v.features.filter((f: string) => !f.startsWith('instagram_reel:'))
    ) : (reelVal ? [`instagram_reel:${reelVal}`] : []),
    is_deleted: v.deleted !== undefined ? v.deleted : (v.is_deleted !== undefined ? v.is_deleted : false)
  };
}

// Sync vehicle images side-by-side with database insertions and updates
export async function syncVehicleImages(vehicleId: string, imageUrls: string[]) {
  if (!imageUrls || !Array.isArray(imageUrls)) return;
  const targetVehicleId = ensureUUID(vehicleId);
  
  console.log(`[SYNC IMAGES] Clearing old records for vehicle: ${targetVehicleId}`);
  const { error: deleteError } = await supabase
    .from('vehicle_images')
    .delete()
    .eq('vehicle_id', targetVehicleId);
    
  if (deleteError) {
    console.error(`[SYNC IMAGES ERROR] Failed to delete existing images for: ${targetVehicleId}`, deleteError);
  }

  if (imageUrls.length > 0) {
    const rows = imageUrls.map((url, index) => ({
      vehicle_id: targetVehicleId,
      image_url: url,
      display_order: index
    }));
    
    console.log(`[SYNC IMAGES] Inserting ${rows.length} records for vehicle: ${targetVehicleId}`);
    const { error: insertError } = await supabase
      .from('vehicle_images')
      .insert(rows);
      
    if (insertError) {
      console.error(`[SYNC IMAGES ERROR] Failed to insert images for: ${targetVehicleId}`, insertError);
    } else {
      console.log(`[SYNC IMAGES SUCCESS] Synced images for: ${targetVehicleId}`);
    }
  }
}

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState<DiagnosticMetrics>({
    supabaseReads: 0,
    supabaseWrites: 0,
    cacheHits: 0,
    cacheMisses: 0,
    metaMatches: 0,
    metaMismatches: 0,
    indexedDbLoads: 0,
    indexedDbSaves: 0
  });

  const incrementMetric = (key: keyof DiagnosticMetrics, amount = 1) => {
    setMetrics(prev => ({
      ...prev,
      [key]: prev[key] + amount
    }));
  };

  const fetchInventory = async () => {
    const normalizeVehicles = (list: any[]) => {
      return list.map(v => {
        if (!v) return null;
        // Map database snake_case columns to React camelCase properties symmetrically
        const fuelType = v.fuelType || v.fuel_type || 'Petrol';
        const transmission = v.transmission || 'Automatic';
        const bodyType = v.bodyType || v.body_type || 'SUV';
        const status = v.status || 'Available';
        const deleted = v.deleted !== undefined ? v.deleted : (v.is_deleted !== undefined ? v.is_deleted : false);
        const updatedAt = v.updatedAt || (v.updated_at ? new Date(v.updated_at).getTime() : Date.now());
        
        let images: string[] = [];

        // 1. Process v.images (could be Array of strings, Array of objects, JSON string, or single string)
        if (v.images) {
          if (Array.isArray(v.images)) {
            images = v.images.map((img: any) => {
              if (typeof img === 'string') return img.trim();
              if (img && typeof img === 'object') {
                return (img.image_url || img.gallery_url || img.fullscreen_url || img.thumbnail_url || img.url || '').trim();
              }
              return '';
            }).filter(Boolean);
          } else if (typeof v.images === 'string') {
            const raw = v.images.trim();
            if (raw.startsWith('[') || raw.startsWith('{')) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  images = parsed.map((img: any) => {
                    if (typeof img === 'string') return img.trim();
                    if (img && typeof img === 'object') {
                      return (img.image_url || img.gallery_url || img.fullscreen_url || img.thumbnail_url || img.url || '').trim();
                    }
                    return '';
                  }).filter(Boolean);
                }
              } catch {}
            } else if (raw.startsWith('http') || raw.startsWith('/') || raw.startsWith('data:')) {
              images = [raw];
            }
          }
        }

        // 2. Process alternative single-image columns (e.g. image_url, thumbnail_url, cover_image, photo)
        const altImageCandidates = [
          v.image_url,
          v.imageUrl,
          v.image,
          v.thumbnail_url,
          v.cover_image,
          v.cover_url,
          v.photo,
          v.photos
        ];
        for (const cand of altImageCandidates) {
          if (cand) {
            if (typeof cand === 'string' && cand.trim()) {
              if (!images.includes(cand.trim())) {
                images.push(cand.trim());
              }
            } else if (Array.isArray(cand)) {
              cand.forEach((item: any) => {
                if (typeof item === 'string' && item.trim() && !images.includes(item.trim())) {
                  images.push(item.trim());
                }
              });
            }
          }
        }

        // 3. Process vehicle_images relation table if present
        if (v.vehicle_images && Array.isArray(v.vehicle_images) && v.vehicle_images.length > 0) {
          const sortedImg = [...v.vehicle_images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          const mappedFromRelations = sortedImg.map(img => (img.image_url || img.gallery_url || img.fullscreen_url || img.thumbnail_url || img.url || '').trim()).filter(Boolean);
          if (mappedFromRelations.length > 0) {
            if (images.length === 0) {
              images = mappedFromRelations;
            } else {
              const set = new Set(images);
              mappedFromRelations.forEach(url => {
                if (!set.has(url)) {
                  images.push(url);
                  set.add(url);
                }
              });
            }
          }
        }
        
        // 4. Resolve all image URLs (GitHub blob conversion, legacy paths, subpath handling)
        images = images.map(img => resolveImageUrl(img)).filter(Boolean);
        
        let features = v.features || [];
        let instagramReel = v.instagram_reel || '';
        
        if (Array.isArray(features)) {
          const reelFeature = features.find((f: any) => typeof f === 'string' && f.startsWith('instagram_reel:'));
          if (reelFeature) {
            if (!instagramReel) {
              instagramReel = reelFeature.slice(15);
            }
            features = features.filter((f: any) => f !== reelFeature);
          }
        }

        // Safe primitives casting to prevent rendering crash from malformed/empty column rows
        const price = typeof v.price === 'number' ? v.price : Number(v.price || 0);
        const mileage = typeof v.mileage === 'number' ? v.mileage : Number(v.mileage || 0);
        const year = typeof v.year === 'number' ? v.year : Number(v.year || new Date().getFullYear());
        const make = v.make || '';
        const model = v.model || '';
        const variant = v.variant || '';
        const ownership = v.ownership || '1st Owner';
        const color = v.color || 'Unknown';
        const engine = v.engine || '';
        const registration = v.registration || '';

        return {
          ...v,
          id: ensureUUID(v.id),
          make,
          model,
          variant,
          year,
          price,
          mileage,
          bodyType,
          fuelType,
          transmission,
          engine,
          color,
          ownership,
          registration,
          status,
          deleted,
          updatedAt,
          images,
          features,
          instagramReel
        } as Vehicle;
      }).filter(Boolean) as Vehicle[];
    };

    try {
      // 1. Immediately read from cache for instataneous first paint
      const cachedVehicles = await getFromCache<Vehicle[]>('vehicles');
      const cachedConfig = await getFromCache<SiteConfig>('site_config');
      const localVersion = await getFromCache<number>('vehicles_version') || 0;

      let hasMountedCache = false;

      if (cachedVehicles && cachedVehicles.length > 0) {
        const normalized = normalizeVehicles(cachedVehicles);
        setVehicles(normalized.filter(v => !v.deleted && v.status !== 'Deleted'));
        hasMountedCache = true;
      } else {
        setVehicles([]);
      }
      
      if (cachedConfig) {
        setSiteConfig({
          ...DEFAULT_CONFIG,
          ...cachedConfig,
          aboutImage: sanitizeAboutImage(cachedConfig.aboutImage),
          homeHeroImage: sanitizeHeroImage(cachedConfig.homeHeroImage),
          homeHeroMobileImage: sanitizeHeroMobileImage(cachedConfig.homeHeroMobileImage),
          logo: sanitizeLogo(cachedConfig.logo),
        });
      } else {
        setSiteConfig(DEFAULT_CONFIG);
      }

      // If we got cached data, we can disable the primary full-page loading spinner instantly!
      if (hasMountedCache) {
        setLoading(false);
      } else {
        setLoading(true);
      }

      // 2. Perform background revalidation and DB fetch with Supabase
      if (isSupabaseConfigured()) {
        try {
          // Check metadata version first (non-blocking if we have cache, blocking if we don't)
          incrementMetric('supabaseReads');
          const { data: metaData, error: metaError } = await supabase
            .from('metadata_versions')
            .select('version')
            .eq('key', 'vehicles')
            .single();

          // If metadata_versions table doesn't exist or returns error, use fallback version 1
          // BUT only re-fetch if we have no local cache at all
          const remoteVersion = metaData?.version !== undefined ? Number(metaData.version) : (localVersion > 0 ? localVersion : 1);

          // 2a. Fetch Site Settings ONLY if not cached or if site settings version changed
          const localSettingsVersion = await getFromCache<number>('site_config_version') || 0;
          let remoteSettingsVersion = 1;
          try {
            const { data: metaSettings } = await supabase
              .from('metadata_versions')
              .select('version')
              .eq('key', 'site_settings')
              .single();
            if (metaSettings?.version !== undefined) {
              remoteSettingsVersion = Number(metaSettings.version);
            }
          } catch {}

          // 2a. Fetch Site Settings from Supabase
          try {
            let siteQuery = await supabase
              .from('site_settings')
              .select('*')
              .limit(1)
              .maybeSingle();

            let siteData = siteQuery.data;
            let siteError = siteQuery.error;

            if (!siteError && siteData) {
              let fetchedAboutImage = siteData.aboutImage || siteData.about_image_url || siteData.about_image || DEFAULT_CONFIG.aboutImage;
              let fetchedClientDeliveries = siteData.clientDeliveries || siteData.client_deliveries || null;
              let fetchedHomeHeroMobileImage = siteData.homeHeroMobileImage || siteData.home_hero_mobile_image_url || undefined;
              let fetchedInstagramReels = siteData.instagramReels || siteData.instagram_reels || null;
              let fetchedHomeHeroVideo = siteData.home_hero_video_url || siteData.home_hero_video || undefined;
              let fetchedHomeHeroMobileVideo = siteData.home_hero_mobile_video_url || siteData.home_hero_mobile_video || undefined;

              let fetchedHomeHeroType: 'video' | 'image' = 'image';

              // Self-healing fallback parsing from dual-persisted encoded fields if present
              if (fetchedAboutImage && fetchedAboutImage.includes('|||')) {
                const parts = fetchedAboutImage.split('|||');
                fetchedAboutImage = parts[0];
                if (parts[1]) {
                  try {
                    const decoded = JSON.parse(parts[1]);
                    if (Array.isArray(decoded)) {
                      fetchedClientDeliveries = decoded;
                    }
                  } catch (e) {
                    console.warn('[SUPABASE FETCH FALLBACK WARNING] Parsing serialized client deliveries failed:', e);
                  }
                }
                if (parts[2]) {
                  fetchedHomeHeroMobileImage = parts[2];
                }
                if (parts[3]) {
                  try {
                    const decoded = JSON.parse(parts[3]);
                    if (Array.isArray(decoded)) {
                      fetchedInstagramReels = decoded;
                    }
                  } catch (e) {
                    console.warn('[SUPABASE FETCH FALLBACK WARNING] Parsing serialized instagram reels failed:', e);
                  }
                }
                if (parts[4]) {
                  fetchedHomeHeroVideo = fetchedHomeHeroVideo || parts[4];
                }
                if (parts[5]) {
                  fetchedHomeHeroMobileVideo = fetchedHomeHeroMobileVideo || parts[5];
                }
                if (parts[6]) {
                  fetchedHomeHeroType = (parts[6] === 'image' || parts[6] === 'video') ? parts[6] as 'video' | 'image' : 'image';
                }
              }

              if (siteData.home_hero_type) {
                fetchedHomeHeroType = (siteData.home_hero_type === 'image' || siteData.home_hero_type === 'video') ? siteData.home_hero_type : fetchedHomeHeroType;
              } else if (siteData.homeHeroType) {
                fetchedHomeHeroType = (siteData.homeHeroType === 'image' || siteData.homeHeroType === 'video') ? siteData.homeHeroType : fetchedHomeHeroType;
              }

              const parsedConfig: SiteConfig = {
                id: siteData.id,
                aboutImage: sanitizeAboutImage(fetchedAboutImage),
                homeHeroImage: sanitizeHeroImage(siteData.homeHeroImage || siteData.home_hero_image_url || siteData.home_hero_image || DEFAULT_CONFIG.homeHeroImage),
                homeHeroMobileImage: sanitizeHeroMobileImage(fetchedHomeHeroMobileImage),
                homeHeroVideo: fetchedHomeHeroVideo,
                homeHeroMobileVideo: fetchedHomeHeroMobileVideo,
                homeHeroType: fetchedHomeHeroType,
                logo: sanitizeLogo(siteData.logo || siteData.logo_url || DEFAULT_CONFIG.logo),
                clientDeliveries: fetchedClientDeliveries || DEFAULT_CONFIG.clientDeliveries,
                instagramReels: fetchedInstagramReels || DEFAULT_CONFIG.instagramReels || []
              };
              setSiteConfig(parsedConfig);
              await saveToCache('site_config', parsedConfig);
            }
          } catch (settingsErr) {
            console.warn('[SUPABASE SETTINGS FETCH SKIP]', settingsErr);
          }

          // 2b. Fetch vehicles from Supabase with relations
          incrementMetric('supabaseReads');
          const { data, error } = await supabase
            .from('vehicles')
            .select('*, vehicle_images(*)')
            .order('created_at', { ascending: false });

          if (!error && data) {
            if (data.length > 0) {
              const normalized = normalizeVehicles(data);
              const filtered = normalized.filter(v => !v.deleted && v.status !== 'Deleted');
              setVehicles(filtered);
              await saveToCache('vehicles', normalized);
            } else if (!hasMountedCache) {
              setVehicles(MOCK_VEHICLES);
            }
          } else if (error) {
            console.warn('Supabase query failed, keeping cache/mock fallback', error);
            if (!hasMountedCache) {
              setVehicles(MOCK_VEHICLES);
            }
          }
        } catch (err) {
          console.warn('Background Supabase revalidation failed, keeping cache/mock fallback', err);
          if (!hasMountedCache) {
            setVehicles(MOCK_VEHICLES);
          }
        }
      } else {
        // Local mode fallback if no cached vehicles are found
        if (!hasMountedCache) {
          setVehicles(MOCK_VEHICLES);
        }
      }
    } catch (error) {
      console.error('[CACHE LOAD FAILED]', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    if (isAdmin && isSupabaseConfigured()) {
      try {
        console.log('[SUPABASE FETCH LEADS] Fetching leads...');
        incrementMetric('supabaseReads');
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[SUPABASE FETCH LEADS ERROR]', error);
          setLeads(MOCK_LEADS);
        } else if (data) {
          console.log('[SUPABASE FETCH LEADS SUCCESS]', data);
          const mappedLeads = data.map(l => {
            let images: string[] = l.images || [];
            let carMsg = l.message || 'General Inquiry';
            
            // Self-healing: if images are embedded in message (e.g. split by |||)
            if (carMsg && carMsg.includes('|||')) {
              const parts = carMsg.split('|||');
              carMsg = parts[0];
              try {
                const parsedImgs = JSON.parse(parts[1]);
                if (Array.isArray(parsedImgs)) {
                  images = parsedImgs;
                }
              } catch (e) {
                console.warn('[LEADS FETCH FALLBACK] Parsing embedded images failed:', e);
              }
            }
            
            return {
              id: l.id,
              name: l.customer_name || '',
              phone: l.phone || '',
              email: l.email || '',
              car: carMsg,
              status: l.status || 'New Lead',
              date: l.created_at ? l.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              images: images
            };
          });
          setLeads(mappedLeads);
        }
      } catch (err) {
        console.error('Failed to fetch leads', err);
        setLeads(MOCK_LEADS);
      }
    } else {
      // Offline / Fallback mode
      setLeads(MOCK_LEADS);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchLeads();
  }, [isAdmin]);

  const addVehicle = async (vehicle: Vehicle) => {
    const targetId = ensureUUID(vehicle.id);
    const cleaned = { ...vehicle, id: targetId, updatedAt: Date.now(), deleted: false };
    
    if (isAdmin && isSupabaseConfigured()) {
      incrementMetric('supabaseWrites');
      const dbPayload = toDbPayload(cleaned);
      console.log('[SUPABASE INSERT] Inserting vehicle:', targetId, dbPayload);
      let { data, error } = await supabase.from('vehicles').insert([dbPayload]).select();
      if (error && (error.message?.includes('body_type') || error.message?.includes('instagram_reel') || error.message?.includes('images') || error.code === '42703')) {
        console.warn('[SUPABASE INSERT RETRY] Missing column on vehicles table. Retrying with fallback payload...', error);
        const retryPayload = { ...dbPayload };
        if (error.message?.includes('body_type')) delete (retryPayload as any).body_type;
        if (error.message?.includes('instagram_reel')) delete (retryPayload as any).instagram_reel;
        if (error.message?.includes('images')) delete (retryPayload as any).images;
        const retryQuery = await supabase.from('vehicles').insert([retryPayload]).select();
        data = retryQuery.data;
        error = retryQuery.error;
      }
      if (error) {
        console.error('[SUPABASE INSERT ERROR]', error);
        throw new Error(`Database Insert Failed: ${error.message}`);
      } else {
        console.log('[SUPABASE INSERT SUCCESS]', data);
        await syncVehicleImages(targetId, cleaned.images);
      }
    }

    const nextList = [cleaned, ...vehicles.filter(v => ensureUUID(v.id) !== targetId)];
    setVehicles(nextList.filter(v => !v.deleted && v.status !== 'Deleted'));
    await saveToCache('vehicles', nextList);
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const targetId = ensureUUID(id);
    const idx = vehicles.findIndex(v => ensureUUID(v.id) === targetId);
    if (idx === -1) {
      console.error('[UPDATE VEHICLE ERROR] Vehicle not found in state:', targetId);
      return;
    }
    const oldVehicle = vehicles[idx];
    const cleaned = { ...oldVehicle, ...updates, id: targetId, updatedAt: Date.now() };

    if (isAdmin && isSupabaseConfigured()) {
      incrementMetric('supabaseWrites');
      
      if (updates.images && oldVehicle.images) {
        const removedImages = oldVehicle.images.filter(img => !updates.images!.includes(img));
        if (removedImages.length > 0) {
          await deleteImagesFromStorage(removedImages, 'vehicle-images');
        }
      }

      const dbPayload = toDbPayload(cleaned);
      console.log('[SUPABASE UPDATE] Updating vehicle:', targetId, dbPayload);
      let { data, error } = await supabase.from('vehicles').update(dbPayload).eq('id', targetId).select();
      if (error && (error.message?.includes('body_type') || error.message?.includes('instagram_reel') || error.message?.includes('images') || error.code === '42703')) {
        console.warn('[SUPABASE UPDATE RETRY] Missing column on vehicles table. Retrying with fallback payload...', error);
        const retryPayload = { ...dbPayload };
        if (error.message?.includes('body_type')) delete (retryPayload as any).body_type;
        if (error.message?.includes('instagram_reel')) delete (retryPayload as any).instagram_reel;
        if (error.message?.includes('images')) delete (retryPayload as any).images;
        const retryQuery = await supabase.from('vehicles').update(retryPayload).eq('id', targetId).select();
        data = retryQuery.data;
        error = retryQuery.error;
      }
      
      if (error) {
        console.error('[SUPABASE UPDATE ERROR]', error);
        throw new Error(`Database Update Failed: ${error.message}`);
      } else {
        console.log('[SUPABASE UPDATE SUCCESS]', data);
        await syncVehicleImages(targetId, cleaned.images);
      }
    }

    const nextList = vehicles.map(v => ensureUUID(v.id) === targetId ? cleaned : v);
    setVehicles(nextList.filter(v => !v.deleted && v.status !== 'Deleted'));
    await saveToCache('vehicles', nextList);
  };

  const removeVehicle = async (id: string) => {
    const targetId = ensureUUID(id);
    const vehicleToDelete = vehicles.find(v => ensureUUID(v.id) === targetId);

    const nextList = vehicles.filter(v => ensureUUID(v.id) !== targetId);
    setVehicles(nextList);
    await saveToCache('vehicles', nextList);

    if (isAdmin && isSupabaseConfigured()) {
      incrementMetric('supabaseWrites');
      try {
        if (vehicleToDelete?.images?.length) {
          await deleteImagesFromStorage(vehicleToDelete.images, 'vehicle-images');
        }
        
        console.log('[SUPABASE DELETE WORKFLOW] Explicitly cleaning dependencies first:', targetId);
        
        // 1. Manually delete rows in vehicle_images table to prevent constraint locks
        const { error: imgDbErr } = await supabase
          .from('vehicle_images')
          .delete()
          .eq('vehicle_id', targetId);
        if (imgDbErr) {
          console.warn('[SUPABASE DELETE IMAGES ROW PRE-CLEANUP ERROR]', imgDbErr);
        }

        // 2. Set vehicle_id to null in leads table to prevent foreign key issues
        const { error: leadsDbErr } = await supabase
          .from('leads')
          .update({ vehicle_id: null })
          .eq('vehicle_id', targetId);
        if (leadsDbErr) {
          console.warn('[SUPABASE UPDATE LEADS VEHICLE_REF PRE-CLEANUP ERROR]', leadsDbErr);
        }

        console.log('[SUPABASE DELETE] Removing vehicle record:', targetId);
        const { error } = await supabase.from('vehicles').delete().eq('id', targetId);
        if (error) {
          console.error('[SUPABASE DELETE ERROR]', error);
        } else {
          console.log('[SUPABASE DELETE SUCCESS] Deleted ID:', targetId);
        }
      } catch (err) {
        console.error('Failed to delete vehicle/images in backend:', err);
      }
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'date' | 'status'>) => {
    const leadId = `l_${Date.now()}`;
    const newLead: Lead = {
      ...leadData,
      id: leadId,
      status: 'New Lead',
      date: new Date().toISOString().split('T')[0]
    };

    if (isSupabaseConfigured()) {
      incrementMetric('supabaseWrites');
      const imagesArray = newLead.images || [];
      const serializedImagesStr = imagesArray.length > 0 ? `|||${JSON.stringify(imagesArray)}` : '';

      const dbLead: any = {
        id: ensureUUID(newLead.id),
        customer_name: newLead.name,
        phone: newLead.phone,
        email: newLead.email || null,
        message: `${newLead.car}${serializedImagesStr}`,
        status: newLead.status,
        created_at: new Date().toISOString(),
        images: imagesArray
      };
      
      console.log('[SUPABASE LEAD INSERT] Attempting Lead Insert:', dbLead);
      let { error } = await supabase.from('leads').insert([dbLead]);
      
      if (error && (error.message?.includes('column') || error.code === '42703')) {
        console.warn('[SUPABASE LEAD INSERT RETRY] Column "images" not supported on leads table. Retrying with serialised message column fallback...');
        const retryLead = { ...dbLead };
        delete retryLead.images;
        const retryQuery = await supabase.from('leads').insert([retryLead]);
        error = retryQuery.error;
      }

      if (error) {
        console.error('[SUPABASE LEAD INSERT ERROR]', error);
      } else {
        console.log('[SUPABASE LEAD INSERT SUCCESS]');
      }
    }

    // Always update leads array in local state block so the UI is immediately updated
    setLeads(prev => [newLead, ...prev]);
  };

  const updateLeadStatus = async (id: string, status: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const updated = { ...lead, status };

    if (isSupabaseConfigured()) {
      incrementMetric('supabaseWrites');
      const imagesArray = updated.images || [];
      const serializedImagesStr = imagesArray.length > 0 ? `|||${JSON.stringify(imagesArray)}` : '';

      const dbLead: any = {
        customer_name: updated.name,
        phone: updated.phone,
        email: updated.email || null,
        message: `${updated.car}${serializedImagesStr}`,
        status: updated.status,
        images: imagesArray
      };
      console.log('[SUPABASE LEAD UPDATE] Updating Lead:', id, dbLead);
      let { error } = await supabase.from('leads').update(dbLead).eq('id', ensureUUID(id));

      if (error && (error.message?.includes('column') || error.code === '42703')) {
        console.warn('[SUPABASE LEAD UPDATE RETRY] Column "images" not supported on leads table. Retrying with serialised message fallback...');
        const retryLead = { ...dbLead };
        delete retryLead.images;
        const retryQuery = await supabase.from('leads').update(retryLead).eq('id', ensureUUID(id));
        error = retryQuery.error;
      }

      if (error) {
        console.error('[SUPABASE LEAD UPDATE ERROR]', error);
      }
    }

    setLeads(prev => prev.map(l => l.id === id ? updated : l));
  };

  const deleteLead = async (id: string) => {
    if (isSupabaseConfigured()) {
      incrementMetric('supabaseWrites');
      console.log('[SUPABASE LEAD DELETE] Removing Lead:', id);
      const { error } = await supabase.from('leads').delete().eq('id', ensureUUID(id));
      if (error) {
        console.error('[SUPABASE LEAD DELETE ERROR]', error);
      }
    }
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const updateSiteConfig = async (updates: Partial<SiteConfig>) => {
    const nextConfig = { ...siteConfig, ...updates };

    if (isAdmin && isSupabaseConfigured()) {
      incrementMetric('supabaseWrites');
      
      // Look for orphaned images in site config and delete from storage
      const removedImages: string[] = [];
      if (updates.logo && siteConfig.logo && updates.logo !== siteConfig.logo) {
        removedImages.push(siteConfig.logo);
      }
      if (updates.homeHeroImage && siteConfig.homeHeroImage && updates.homeHeroImage !== siteConfig.homeHeroImage) {
        removedImages.push(siteConfig.homeHeroImage);
      }
      if (updates.homeHeroMobileImage && siteConfig.homeHeroMobileImage && updates.homeHeroMobileImage !== siteConfig.homeHeroMobileImage) {
        removedImages.push(siteConfig.homeHeroMobileImage);
      }
      if (updates.aboutImage && siteConfig.aboutImage && updates.aboutImage !== siteConfig.aboutImage) {
        removedImages.push(siteConfig.aboutImage);
      }
      if (updates.homeHeroVideo && siteConfig.homeHeroVideo && updates.homeHeroVideo !== siteConfig.homeHeroVideo) {
        removedImages.push(siteConfig.homeHeroVideo);
      }
      if (updates.homeHeroMobileVideo && siteConfig.homeHeroMobileVideo && updates.homeHeroMobileVideo !== siteConfig.homeHeroMobileVideo) {
        removedImages.push(siteConfig.homeHeroMobileVideo);
      }
      if (updates.clientDeliveries && siteConfig.clientDeliveries) {
         siteConfig.clientDeliveries.forEach(img => {
            if (!updates.clientDeliveries!.includes(img)) {
              removedImages.push(img);
            }
         });
      }
      if (removedImages.length > 0) {
        await deleteImagesFromStorage(removedImages, 'site_settings');
      }

      // Clean previous trailing serializer encoded tail to prevent recursive accumulation
      let baseAboutImage = nextConfig.aboutImage || '';
      if (baseAboutImage.includes('|||')) {
        baseAboutImage = baseAboutImage.split('|||')[0];
      }
      const deliveriesPart = (nextConfig.clientDeliveries && nextConfig.clientDeliveries.length > 0) ? JSON.stringify(nextConfig.clientDeliveries) : '[]';
      const mobileHeroPart = nextConfig.homeHeroMobileImage || '';
      const reelsPart = (nextConfig.instagramReels && nextConfig.instagramReels.length > 0) ? JSON.stringify(nextConfig.instagramReels) : '[]';
      const homeHeroVideoPart = nextConfig.homeHeroVideo || '';
      const homeHeroMobileVideoPart = nextConfig.homeHeroMobileVideo || '';
      const homeHeroTypePart = nextConfig.homeHeroType || 'video';
      const encodedAboutImageWithDeliveries = `${baseAboutImage}|||${deliveriesPart}|||${mobileHeroPart}|||${reelsPart}|||${homeHeroVideoPart}|||${homeHeroMobileVideoPart}|||${homeHeroTypePart}`;

      // Payload strictly matching the official schema.sql columns.
      // If client_deliveries is an unrecognized/missing column on the user's Supabase table (as shown in their screenshot),
      // our self-healing retry loop below will discard the 'client_deliveries' key from attemptPayload,
      // and successfully write to 'about_image_url' with 'client_deliveries' robustly embedded.
      const attemptPayload: any = {
        id: nextConfig.id || '00000000-0000-0000-0000-000000000000',
        company_name: 'Bombay Motors',
        about_image_url: encodedAboutImageWithDeliveries || null,
        home_hero_image_url: nextConfig.homeHeroImage || null,
        home_hero_mobile_image_url: nextConfig.homeHeroMobileImage || null,
        home_hero_video_url: nextConfig.homeHeroVideo || null,
        home_hero_mobile_video_url: nextConfig.homeHeroMobileVideo || null,
        home_hero_type: nextConfig.homeHeroType || 'video',
        logo_url: nextConfig.logo || null,
        client_deliveries: nextConfig.clientDeliveries || [],
        instagram_reels: nextConfig.instagramReels || [],
        updated_at: new Date().toISOString()
      };
      
      console.log('[SUPABASE UPDATE CONFIG] Synchronizing with site_settings table:', attemptPayload.id);
      
      let error: any = null;

      // Self-healing attempt loop: parses database column-unrecognized error responses,
      // drops the unsupported column dynamically, and retries the persistence.
      for (let attempt = 0; attempt < 8; attempt++) {
        const { data: existingRow, error: checkError } = await supabase
          .from('site_settings')
          .select('id')
          .eq('id', attemptPayload.id)
          .maybeSingle();

        if (!checkError && existingRow) {
          const { error: updateError } = await supabase
            .from('site_settings')
            .update(attemptPayload)
            .eq('id', attemptPayload.id);
          error = updateError;
        } else {
          const { error: upsertError } = await supabase
            .from('site_settings')
            .upsert([attemptPayload]);
          error = upsertError;
        }

        if (error && (error.message?.includes('column') || error.code === '42703' || error.message?.includes('relation') || error.message?.includes('permission') || error.code?.includes('PGRST'))) {
          // Extract column name from error message (handles: column "col_name", 'col_name' column, or column 'col_name')
          const matchDouble = error.message.match(/column "([^"]+)"/);
          const matchSingleSuffix = error.message.match(/'([^']+)' column/);
          const matchSinglePrefix = error.message.match(/column '([^']+)'/);
          
          let badCol = null;
          if (matchDouble && matchDouble[1]) badCol = matchDouble[1];
          else if (matchSingleSuffix && matchSingleSuffix[1]) badCol = matchSingleSuffix[1];
          else if (matchSinglePrefix && matchSinglePrefix[1]) badCol = matchSinglePrefix[1];

          if (badCol) {
            console.warn(`[SUPABASE CONFIG RETRY] Column "${badCol}" not supported on table. Removing from payload and retrying...`);
            delete attemptPayload[badCol];
            continue;
          }
        }
        break;
      }

      if (error) {
        console.error('[SUPABASE UPDATE CONFIG ERROR] Resilient configuration synchronization failed:', error);
      } else {
        console.log('[SUPABASE UPDATE CONFIG SUCCESS] Site settings synchronized successfully.');
      }
    }

    setSiteConfig(nextConfig);
    await saveToCache('site_config', nextConfig);
  };

  const migrateLocalStorage = async () => {
    const saved = localStorage.getItem('cartronics_vehicles_v2') || localStorage.getItem('lust_over_rust_vehicles_v2') || localStorage.getItem('jackpot_cars_vehicles_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setVehicles(parsed);
        await saveToCache('vehicles', parsed);
        return true;
      }
    }
    return false;
  };

  const seedSampleData = async (): Promise<boolean> => {
    const nextList = [...MOCK_VEHICLES, ...vehicles.filter(v1 => !MOCK_VEHICLES.some(v2 => v2.id === v1.id))];
    const normalizedList = nextList.map(v => ({ ...v, id: ensureUUID(v.id) }));
    setVehicles(normalizedList.filter(v => !v.deleted && v.status !== 'Deleted'));
    await saveToCache('vehicles', normalizedList);
    
    if (isAdmin && isSupabaseConfigured()) {
      incrementMetric('supabaseWrites');
      const dbPayload = MOCK_VEHICLES.map(v => toDbPayload(v));
      console.log('[SUPABASE SEED] Seeding database with mock vehicles:', dbPayload);
      const { data, error } = await supabase.from('vehicles').upsert(dbPayload).select();
      if (error) {
        console.error('[SUPABASE SEED ERROR]', error);
        throw new Error(`Database Seed Failed: ${error.message}`);
      } else {
        console.log('[SUPABASE SEED SUCCESS]', data);
        for (const v of MOCK_VEHICLES) {
          await syncVehicleImages(ensureUUID(v.id), v.images);
        }
      }
    }
    return true;
  };

  const refreshInventory = async () => {
    await fetchInventory();
  };

  return (
    <VehicleContext.Provider value={{
      vehicles,
      leads,
      siteConfig,
      loading,
      addVehicle,
      updateVehicle,
      removeVehicle,
      addLead,
      updateLeadStatus,
      deleteLead,
      updateSiteConfig,
      migrateLocalStorage,
      seedSampleData,
      metrics,
      refreshInventory,
      fetchLeads
    }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
}
