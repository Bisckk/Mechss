-- ============================================================
-- MotoFix SaaS — Auth → Profile sync
-- Migration: 00002_auth_user_trigger
--
-- Problem: public.users rows must exist for RLS helpers
-- (get_my_role / get_my_workshop_id) to work. Supabase Auth
-- does NOT write into public schema automatically.
--
-- Solution: AFTER INSERT trigger on auth.users that creates
-- the matching public.users row. Role and workshop_id can be
-- passed as user_metadata at sign-up time (service-role calls)
-- or default to 'admin' / NULL for self-service registration.
-- ============================================================

-- ── 1. Trigger function ───────────────────────────────────

CREATE OR REPLACE FUNCTION fn_handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role        user_role;
  v_workshop_id UUID;
  v_full_name   TEXT;
BEGIN
  -- Read optional metadata passed at sign-up:
  --   supabase.auth.signUp({ email, password, options: { data: {
  --     role: 'mechanic', workshop_id: '...', full_name: 'John Doe'
  --   }}})
  v_role        := COALESCE(
                    (NEW.raw_user_meta_data->>'role')::user_role,
                    'admin'   -- default for self-service workshop owners
                  );
  v_workshop_id := (NEW.raw_user_meta_data->>'workshop_id')::UUID;
  v_full_name   := COALESCE(
                    NEW.raw_user_meta_data->>'full_name',
                    NEW.raw_user_meta_data->>'name',
                    SPLIT_PART(NEW.email, '@', 1)   -- fallback: "john.doe"
                  );

  INSERT INTO public.users (id, workshop_id, role, full_name, email)
  VALUES (NEW.id, v_workshop_id, v_role, v_full_name, NEW.email)
  ON CONFLICT (id) DO NOTHING;   -- idempotent: safe to replay

  RETURN NEW;
END;
$$;

-- ── 2. Attach trigger ─────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION fn_handle_new_auth_user();

-- ── 3. Backfill: sync existing auth users ─────────────────
--
-- Run this once to create public.users rows for any auth.users
-- that already exist (e.g. accounts you created manually).
-- Skips rows that are already in public.users (ON CONFLICT).
--
-- Default role assigned: 'admin'
-- To change a specific user afterwards:
--   UPDATE public.users SET role = 'superadmin' WHERE email = 'you@example.com';

INSERT INTO public.users (id, workshop_id, role, full_name, email)
SELECT
  au.id,
  NULL::UUID                          AS workshop_id,
  COALESCE(
    (au.raw_user_meta_data->>'role')::user_role,
    'admin'
  )                                   AS role,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  )                                   AS full_name,
  au.email
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Promote a user to superadmin (run manually) ────────
--
-- After the backfill, set your own account as superadmin:
--
--   UPDATE public.users
--   SET role = 'superadmin', workshop_id = NULL
--   WHERE email = 'your-superadmin@email.com';
--
-- Superadmin intentionally has workshop_id = NULL.
-- All other roles must have a workshop_id assigned.
