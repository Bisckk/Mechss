-- ============================================================
-- Migration: Allow superadmin full access to repairs and repair_updates
-- Follows the same pattern already used for plans, workshops, and users tables.
-- Root cause: get_my_workshop_id() returns NULL for superadmin (no workshop_id
-- in users table), causing workshop_id = get_my_workshop_id() to evaluate as
-- workshop_id = NULL → always false → RLS blocks the INSERT.
-- ============================================================

CREATE POLICY "repairs: superadmin all"
  ON repairs FOR ALL
  USING (get_my_role() = 'superadmin')
  WITH CHECK (get_my_role() = 'superadmin');

CREATE POLICY "repair_updates: superadmin all"
  ON repair_updates FOR ALL
  USING (get_my_role() = 'superadmin')
  WITH CHECK (get_my_role() = 'superadmin');
