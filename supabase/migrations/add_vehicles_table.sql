-- ============================================================
-- Migration: Add vehicles table + extend appointments
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create VEHICLES table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id   uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plate         text NOT NULL,
  brand         text NOT NULL,
  model         text NOT NULL,
  year          smallint,
  fuel_type     text CHECK (fuel_type IN ('FI', 'Carburada')),
  color         text,
  notes         text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_workshop ON public.vehicles(workshop_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_client ON public.vehicles(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_plate_workshop ON public.vehicles(workshop_id, plate);

-- 2. Add vehicle_id and vehicle_info columns to appointments (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'vehicle_info'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN vehicle_info text;
  END IF;
END $$;

-- 3. Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: users can see vehicles from their own workshop
CREATE POLICY "Users can view own workshop vehicles"
  ON public.vehicles FOR SELECT
  USING (
    workshop_id = (SELECT workshop_id FROM public.users WHERE id = auth.uid())
  );

-- Policy: users can insert vehicles into their own workshop
CREATE POLICY "Users can insert own workshop vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (
    workshop_id = (SELECT workshop_id FROM public.users WHERE id = auth.uid())
  );

-- Policy: users can update vehicles in their own workshop
CREATE POLICY "Users can update own workshop vehicles"
  ON public.vehicles FOR UPDATE
  USING (
    workshop_id = (SELECT workshop_id FROM public.users WHERE id = auth.uid())
  );

-- 4. Updated_at trigger for vehicles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicles_updated_at ON public.vehicles;
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
