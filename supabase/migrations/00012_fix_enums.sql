-- ============================================================
-- Migration: Fix repair_status and user_role ENUM values
-- Root cause: UI code uses 'in_progress', 'repairing', 'completed'
-- but the original migration defined different values for repair_status.
-- Also adds 'superadmin' to user_role which was missing.
-- ============================================================

-- Add missing repair_status values used by the UI kanban columns
ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'repairing';
ALTER TYPE repair_status ADD VALUE IF NOT EXISTS 'completed';

-- Add superadmin to user_role (was missing from original migration)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
