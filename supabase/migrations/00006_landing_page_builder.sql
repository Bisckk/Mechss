-- Migration: 00006_landing_page_builder
-- Description: Creates the configuration tables for the Workshop Landing Page Builder

-- Create generic modified timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.workshop_landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'motos-pepe' -> /t/motos-pepe
    is_published BOOLEAN DEFAULT false,
    
    -- Aesthetic Configuration
    theme_preset VARCHAR(50) DEFAULT 'cyberpunk',     -- 'cyberpunk', 'elegant', 'minimal'
    font_family VARCHAR(100) DEFAULT 'Inter',           -- Google Fonts: 'Inter', 'Oswald', 'Playfair Display', etc.
    button_radius VARCHAR(20) DEFAULT 'rounded-xl',       -- 'rounded-none' (sharp), 'rounded-xl' (soft), 'rounded-full' (pill)
    primary_color VARCHAR(20) DEFAULT '#f97316',        -- Hex code for main accent (Orange by default)
    bg_color VARCHAR(20) DEFAULT '#09090b',             -- Main background
    
    -- Content Blocks (The actual sections of the page, maintaining order)
    -- Expected JSON structure:
    -- [
    --   { "id": "hero_1", "type": "hero", "visible": true, "content": { "title": "...", "subtitle": "...", "image": "..." } },
    --   { "id": "track_1", "type": "tracking", "visible": true, "content": { "title": "Rastrea tu moto" } },
    --   { "id": "about_1", "type": "about", "visible": true, "content": { "text": "..." } }
    -- ]
    blocks JSONB DEFAULT '[]'::jsonb,
    
    -- SEO / Meta
    meta_title VARCHAR(150),
    meta_description TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one workshop has only one landing page config (for a 1-to-1 relationship)
    CONSTRAINT workshop_landing_pages_workshop_id_key UNIQUE (workshop_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_landing_pages_workshop ON public.workshop_landing_pages(workshop_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.workshop_landing_pages(slug);

-- Enable RLS
ALTER TABLE public.workshop_landing_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read if published
CREATE POLICY "Public can view published landing pages" 
ON public.workshop_landing_pages FOR SELECT 
USING (is_published = true);

-- Policy: Admin can read their own landing page config
CREATE POLICY "Admins can view their own landing page" 
ON public.workshop_landing_pages FOR SELECT 
USING (workshop_id = public.get_my_workshop_id() OR public.get_my_role() = 'superadmin');

-- Policy: Admin can insert/update their own landing page config
CREATE POLICY "Admins can insert their own landing page" 
ON public.workshop_landing_pages FOR INSERT 
WITH CHECK (workshop_id = public.get_my_workshop_id() OR public.get_my_role() = 'superadmin');

CREATE POLICY "Admins can update their own landing page" 
ON public.workshop_landing_pages FOR UPDATE 
USING (workshop_id = public.get_my_workshop_id() OR public.get_my_role() = 'superadmin');

-- Auto update timestamp trigger
CREATE TRIGGER update_workshop_landing_pages_modtime
    BEFORE UPDATE ON public.workshop_landing_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
