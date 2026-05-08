-- Migration: 00010_landing_logo_cover
-- Description: Adds logo_url and cover_url to the landing page config

ALTER TABLE public.workshop_landing_pages
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_url TEXT;
