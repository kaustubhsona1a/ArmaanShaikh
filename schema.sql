-- Production Database Schema & RLS Policies for Jackpot Cars

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLES
-- ==========================================

-- Admins Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    variant TEXT,
    year INT NOT NULL,
    price BIGINT NOT NULL,
    mileage INT NOT NULL,
    fuel_type TEXT NOT NULL,
    transmission TEXT NOT NULL,
    engine TEXT,
    color TEXT,
    ownership TEXT,
    registration TEXT,
    status TEXT DEFAULT 'Available',
    featured BOOLEAN DEFAULT false,
    description TEXT,
    instagram_reel TEXT,
    inspection_notes TEXT,
    features TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Images Table
CREATE TABLE IF NOT EXISTS public.vehicle_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    message TEXT,
    status TEXT DEFAULT 'New',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    instagram_url TEXT,
    whatsapp_number TEXT,
    google_maps_url TEXT,
    about_image_url TEXT,
    home_hero_image_url TEXT,
    logo_url TEXT,
    client_deliveries TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metadata Versioning (For Caching)
CREATE TABLE IF NOT EXISTS public.metadata_versions (
    key TEXT PRIMARY KEY,
    version BIGINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial metadata versions
INSERT INTO public.metadata_versions (key, version) VALUES ('vehicles', 1) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.metadata_versions (key, version) VALUES ('site_settings', 1) ON CONFLICT (key) DO NOTHING;


-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metadata_versions ENABLE ROW LEVEL SECURITY;

-- Helper Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Storage Policies for vehicle-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access to Vehicle Images" ON storage.objects;
CREATE POLICY "Public Access to Vehicle Images" ON storage.objects
    FOR SELECT USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Admin Insert to Vehicle Images" ON storage.objects;
CREATE POLICY "Admin Insert to Vehicle Images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Admin Update to Vehicle Images" ON storage.objects;
CREATE POLICY "Admin Update to Vehicle Images" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Admin Delete to Vehicle Images" ON storage.objects;
CREATE POLICY "Admin Delete to Vehicle Images" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'vehicle-images');

-- Storage Policies for site_settings bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site_settings', 'site_settings', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access to Site Settings Images" ON storage.objects;
CREATE POLICY "Public Access to Site Settings Images" ON storage.objects
    FOR SELECT USING (bucket_id = 'site_settings');

DROP POLICY IF EXISTS "Admin Insert to Site Settings Images" ON storage.objects;
CREATE POLICY "Admin Insert to Site Settings Images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site_settings');

DROP POLICY IF EXISTS "Admin Update to Site Settings Images" ON storage.objects;
CREATE POLICY "Admin Update to Site Settings Images" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'site_settings');

DROP POLICY IF EXISTS "Admin Delete to Site Settings Images" ON storage.objects;
CREATE POLICY "Admin Delete to Site Settings Images" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'site_settings');

-- Vehicles RLS
DROP POLICY IF EXISTS "Vehicles are viewable by everyone" ON public.vehicles;
CREATE POLICY "Vehicles are viewable by everyone" ON public.vehicles
    FOR SELECT USING (is_deleted = false OR is_admin());

DROP POLICY IF EXISTS "Vehicles are insertable by admins only" ON public.vehicles;
CREATE POLICY "Vehicles are insertable by admins only" ON public.vehicles
    FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Vehicles are updatable by admins only" ON public.vehicles;
CREATE POLICY "Vehicles are updatable by admins only" ON public.vehicles
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Vehicles are deletable by admins only" ON public.vehicles;
CREATE POLICY "Vehicles are deletable by admins only" ON public.vehicles
    FOR DELETE USING (is_admin());

-- Vehicle Images RLS
DROP POLICY IF EXISTS "Vehicle images are viewable by everyone" ON public.vehicle_images;
CREATE POLICY "Vehicle images are viewable by everyone" ON public.vehicle_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vehicle images are managed by admins only" ON public.vehicle_images;
CREATE POLICY "Vehicle images are managed by admins only" ON public.vehicle_images
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Leads RLS
DROP POLICY IF EXISTS "Leads are insertable by everyone" ON public.leads;
CREATE POLICY "Leads are insertable by everyone" ON public.leads
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Leads are viewable and updatable by admins only" ON public.leads;
CREATE POLICY "Leads are viewable and updatable by admins only" ON public.leads
    FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Leads update allowed for admins" ON public.leads;
CREATE POLICY "Leads update allowed for admins" ON public.leads
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Leads are deletable by admins only" ON public.leads;
CREATE POLICY "Leads are deletable by admins only" ON public.leads
    FOR DELETE USING (is_admin());

-- Site Settings RLS
DROP POLICY IF EXISTS "Site settings viewable by everyone" ON public.site_settings;
CREATE POLICY "Site settings viewable by everyone" ON public.site_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Site settings updatable by admins only" ON public.site_settings;
DROP POLICY IF EXISTS "Site settings managed by admins only" ON public.site_settings;
CREATE POLICY "Site settings managed by admins only" ON public.site_settings
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Admins RLS
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins" ON public.admins
    FOR SELECT USING (auth.uid() = id);

-- Metadata RLS
DROP POLICY IF EXISTS "Metadata viewable by everyone" ON public.metadata_versions;
CREATE POLICY "Metadata viewable by everyone" ON public.metadata_versions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Metadata managed by admins" ON public.metadata_versions;
CREATE POLICY "Metadata managed by admins" ON public.metadata_versions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ==========================================
-- 3. TRIGGERS
-- ==========================================

-- Function to increment metadata version
CREATE OR REPLACE FUNCTION public.increment_metadata_version() RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.metadata_versions SET version = version + 1, updated_at = NOW() WHERE key = TG_ARGV[0];
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map triggers
DROP TRIGGER IF EXISTS trigger_update_vehicles_version ON public.vehicles;
CREATE TRIGGER trigger_update_vehicles_version
    AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
    FOR EACH STATEMENT EXECUTE FUNCTION public.increment_metadata_version('vehicles');

DROP TRIGGER IF EXISTS trigger_update_settings_version ON public.site_settings;
CREATE TRIGGER trigger_update_settings_version
    AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
    FOR EACH STATEMENT EXECUTE FUNCTION public.increment_metadata_version('site_settings');

-- Create trigger to automatically add new auth users as admins if needed (optional)
-- Here we'll manage admins manually or via specific app logic.

