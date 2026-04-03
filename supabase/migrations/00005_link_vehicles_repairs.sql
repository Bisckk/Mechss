-- ============================================================
-- Migration: Add vehicle_id to repairs table
-- ============================================================

DO $$
BEGIN
  -- Add vehicle_id column if it does not exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'repairs' AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE public.repairs ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create an index to quickly find repairs for a specific vehicle
CREATE INDEX IF NOT EXISTS idx_repairs_vehicle ON public.repairs(vehicle_id);
