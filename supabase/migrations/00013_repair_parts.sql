-- Migration: 00013_repair_parts
-- Description: Adds parts JSONB column to repair_updates for tracking parts used per log entry

ALTER TABLE public.repair_updates
    ADD COLUMN IF NOT EXISTS parts JSONB DEFAULT '[]'::jsonb;
