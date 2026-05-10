-- Migration: 00014_pending_completion
-- Description: Adds pending_completion status for mechanic → admin approval workflow
--              and creates the repair-photos storage bucket

-- Add pending_completion to status enum (safe if it already exists)
DO $$ BEGIN
    ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'pending_completion';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create repair-photos bucket (public read, any size up to 15MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'repair-photos',
    'repair-photos',
    true,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Public read for repair photos (clients can view them)
DO $$ BEGIN
    CREATE POLICY "Public can view repair photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'repair-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
