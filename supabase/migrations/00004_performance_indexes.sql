-- ============================================================
-- Migration: Performance indexes for calendar module
-- ============================================================

-- Composite index for the most common vehicle lookup pattern:
-- getClientVehiclesAction filters by (client_id, is_active) ordered by created_at.
-- A single idx_vehicles_client already exists but adding is_active improves
-- index-only scans when listing active vehicles per client.
CREATE INDEX IF NOT EXISTS idx_vehicles_client_active
  ON public.vehicles(client_id, is_active, created_at DESC);

-- Composite index for appointment queries scoped by workshop + scheduled date.
-- The appointments page orders by scheduled_at; adding workshop_id as leading
-- column lets Postgres skip rows outside the current workshop efficiently.
CREATE INDEX IF NOT EXISTS idx_appointments_workshop_scheduled
  ON public.appointments(workshop_id, scheduled_at ASC);

-- Index to speed up the get_my_workshop_id() and get_my_role() RLS helper
-- functions, which run a SELECT on users(id) on every query that hits RLS.
-- auth.uid() maps to users.id — make sure that lookup is O(1).
-- (This should already be a PK index, but explicitly ensures it exists.)
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- Index for client text-search queries (ILIKE on full_name within a workshop).
-- pg_trgm-based indexes would be ideal but require the extension.
-- A regular btree on (workshop_id, is_active) at least prunes the scan set
-- before the ILIKE filter is applied.
CREATE INDEX IF NOT EXISTS idx_clients_workshop_active
  ON public.clients(workshop_id, is_active);
