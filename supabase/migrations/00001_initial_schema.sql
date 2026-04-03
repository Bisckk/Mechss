-- ============================================================
-- MotoFix SaaS — Initial Schema
-- Migration: 00001_initial_schema
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'admin',
  'receptionist',
  'mechanic'
);

CREATE TYPE plan_status AS ENUM (
  'trial',
  'active',
  'inactive'
);

CREATE TYPE appointment_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE repair_status AS ENUM (
  'received',
  'diagnosing',
  'waiting_parts',
  'in_repair',
  'quality_check',
  'ready'super,
  'delivered'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'partial',
  'paid',
  'refunded'
);

CREATE TYPE accounting_type AS ENUM (
  'income',
  'expense'
);

-- ============================================================
-- PLANS  (SaaS tiers — managed by superadmin)
-- ============================================================

CREATE TABLE plans (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(100) NOT NULL,
  slug             VARCHAR(50)  UNIQUE NOT NULL,
  description      TEXT,
  price_monthly    NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly     NUMERIC(10,2) NOT NULL DEFAULT 0,
  trial_days       INTEGER       NOT NULL DEFAULT 14,
  max_users        INTEGER       NOT NULL DEFAULT 5,   -- -1 = unlimited
  max_clients      INTEGER       NOT NULL DEFAULT 500, -- -1 = unlimited
  features         JSONB         NOT NULL DEFAULT '{}',
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKSHOPS  (tenants)
-- ============================================================

CREATE TABLE workshops (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id              UUID        REFERENCES plans(id) ON DELETE SET NULL,
  name                 VARCHAR(200) NOT NULL,
  slug                 VARCHAR(100) UNIQUE NOT NULL,
  email                VARCHAR(255),
  phone                VARCHAR(50),
  address              TEXT,
  city                 VARCHAR(100),
  country              VARCHAR(100) NOT NULL DEFAULT 'US',
  logo_url             TEXT,
  plan_status          plan_status  NOT NULL DEFAULT 'trial',
  trial_ends_at        TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  -- Admin-configurable settings (timezone, currency, …)
  settings             JSONB        NOT NULL DEFAULT '{}',
  -- Landing page builder JSON (WP-style block config)
  landing_page_config  JSONB        NOT NULL DEFAULT '{}',
  is_active            BOOLEAN      NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS  (profiles; id mirrors auth.users)
-- ============================================================

CREATE TABLE users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workshop_id  UUID        REFERENCES workshops(id) ON DELETE SET NULL,
  role         user_role   NOT NULL DEFAULT 'mechanic',
  full_name    VARCHAR(200) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(50),
  avatar_url   TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Superadmin has no workshop (workshop_id IS NULL).
-- Created via service-role after first auth.user insert.

-- ============================================================
-- CLIENTS
-- ============================================================

CREATE TABLE clients (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id  UUID        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  full_name    VARCHAR(200) NOT NULL,
  email        VARCHAR(255),
  phone        VARCHAR(50),
  address      TEXT,
  notes        TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id      UUID              NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  client_id        UUID              NOT NULL REFERENCES clients(id)   ON DELETE RESTRICT,
  mechanic_id      UUID              REFERENCES users(id) ON DELETE SET NULL,
  title            VARCHAR(300)      NOT NULL,
  description      TEXT,
  scheduled_at     TIMESTAMPTZ       NOT NULL,
  duration_minutes INTEGER           NOT NULL DEFAULT 60,
  status           appointment_status NOT NULL DEFAULT 'pending',
  notes            TEXT,
  created_by       UUID              REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE inventory (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id  UUID         NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  name         VARCHAR(300) NOT NULL,
  sku          VARCHAR(100),
  description  TEXT,
  category     VARCHAR(100),
  unit         VARCHAR(50)  NOT NULL DEFAULT 'unit',
  quantity     NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,  -- triggers low-stock alert
  cost_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier     VARCHAR(200),
  is_active    BOOLEAN       NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, sku)
);

-- ============================================================
-- REPAIRS
-- ============================================================

CREATE TABLE repairs (
  id                  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id         UUID           NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  client_id           UUID           NOT NULL REFERENCES clients(id)   ON DELETE RESTRICT,
  appointment_id      UUID           REFERENCES appointments(id) ON DELETE SET NULL,
  mechanic_id         UUID           REFERENCES users(id) ON DELETE SET NULL,
  -- Auto-generated, unique, human-readable (see trigger below)
  tracking_code       VARCHAR(20)    UNIQUE NOT NULL DEFAULT '',
  vehicle_brand       VARCHAR(100),
  vehicle_model       VARCHAR(100),
  vehicle_year        SMALLINT,
  vehicle_plate       VARCHAR(50),
  vehicle_vin         VARCHAR(100),
  mileage             INTEGER,
  reported_issue      TEXT           NOT NULL,
  diagnosis           TEXT,
  status              repair_status  NOT NULL DEFAULT 'received',
  estimated_cost      NUMERIC(10,2),
  final_cost          NUMERIC(10,2),
  payment_status      payment_status NOT NULL DEFAULT 'pending',
  estimated_completion TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  client_notified_at  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Tracking-code auto-generator ──────────────────────────

CREATE OR REPLACE FUNCTION fn_generate_tracking_code()
RETURNS TRIGGER AS $$
DECLARE
  v_code  VARCHAR(20);
  v_taken BOOLEAN;
BEGIN
  IF NEW.tracking_code IS NOT NULL AND NEW.tracking_code <> '' THEN
    RETURN NEW;
  END IF;
  LOOP
    v_code := 'REP-' || UPPER(SUBSTR(MD5(gen_random_bytes(8)::TEXT), 1, 8));
    SELECT EXISTS(SELECT 1 FROM repairs WHERE tracking_code = v_code) INTO v_taken;
    EXIT WHEN NOT v_taken;
  END LOOP;
  NEW.tracking_code := v_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_repairs_tracking_code
  BEFORE INSERT ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION fn_generate_tracking_code();

-- ============================================================
-- REPAIR UPDATES  (mechanic log: text + photos)
-- ============================================================

CREATE TABLE repair_updates (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  repair_id        UUID          NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  user_id          UUID          NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
  status           repair_status NOT NULL,
  notes            TEXT,
  -- Array of Supabase Storage public URLs
  photos           JSONB         NOT NULL DEFAULT '[]',
  is_client_visible BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ACCOUNTING
-- ============================================================

CREATE TABLE accounting (
  id               UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id      UUID             NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  repair_id        UUID             REFERENCES repairs(id) ON DELETE SET NULL,
  user_id          UUID             REFERENCES users(id)   ON DELETE SET NULL,
  type             accounting_type  NOT NULL,
  category         VARCHAR(100)     NOT NULL,
  description      TEXT             NOT NULL,
  amount           NUMERIC(10,2)    NOT NULL,
  payment_method   VARCHAR(50),
  reference        VARCHAR(200),
  transaction_date DATE             NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_workshop_id  ON users(workshop_id);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_email        ON users(email);

-- clients
CREATE INDEX idx_clients_workshop_id ON clients(workshop_id);
CREATE INDEX idx_clients_email       ON clients(email);

-- appointments
CREATE INDEX idx_appointments_workshop_id  ON appointments(workshop_id);
CREATE INDEX idx_appointments_mechanic_id  ON appointments(mechanic_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status       ON appointments(status);

-- inventory
CREATE INDEX idx_inventory_workshop_id ON inventory(workshop_id);
CREATE INDEX idx_inventory_category    ON inventory(category);

-- repairs
CREATE INDEX idx_repairs_workshop_id    ON repairs(workshop_id);
CREATE INDEX idx_repairs_tracking_code  ON repairs(tracking_code);
CREATE INDEX idx_repairs_client_id      ON repairs(client_id);
CREATE INDEX idx_repairs_mechanic_id    ON repairs(mechanic_id);
CREATE INDEX idx_repairs_status         ON repairs(status);

-- repair_updates
CREATE INDEX idx_repair_updates_repair_id ON repair_updates(repair_id);
CREATE INDEX idx_repair_updates_user_id   ON repair_updates(user_id);

-- accounting
CREATE INDEX idx_accounting_workshop_id       ON accounting(workshop_id);
CREATE INDEX idx_accounting_transaction_date  ON accounting(transaction_date);
CREATE INDEX idx_accounting_type              ON accounting(type);

-- ============================================================
-- updated_at TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plans_updated_at        BEFORE UPDATE ON plans        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_workshops_updated_at    BEFORE UPDATE ON workshops    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_users_updated_at        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_clients_updated_at      BEFORE UPDATE ON clients      FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_inventory_updated_at    BEFORE UPDATE ON inventory    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_repairs_updated_at      BEFORE UPDATE ON repairs      FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_accounting_updated_at   BEFORE UPDATE ON accounting   FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting    ENABLE ROW LEVEL SECURITY;

-- ── Helper functions (SECURITY DEFINER = bypasses RLS) ────

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_workshop_id()
RETURNS UUID AS $$
  SELECT workshop_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PLANS ─────────────────────────────────────────────────

-- Everyone can read plans (public pricing page + app)
CREATE POLICY "plans: public read"
  ON plans FOR SELECT
  USING (true);

-- Only superadmin can mutate
CREATE POLICY "plans: superadmin write"
  ON plans FOR ALL
  USING (get_my_role() = 'superadmin')
  WITH CHECK (get_my_role() = 'superadmin');

-- ── WORKSHOPS ─────────────────────────────────────────────

CREATE POLICY "workshops: superadmin all"
  ON workshops FOR ALL
  USING (get_my_role() = 'superadmin')
  WITH CHECK (get_my_role() = 'superadmin');

CREATE POLICY "workshops: member read own"
  ON workshops FOR SELECT
  USING (id = get_my_workshop_id());

CREATE POLICY "workshops: admin update own"
  ON workshops FOR UPDATE
  USING (id = get_my_workshop_id() AND get_my_role() = 'admin')
  WITH CHECK (id = get_my_workshop_id() AND get_my_role() = 'admin');

-- ── USERS ─────────────────────────────────────────────────

CREATE POLICY "users: superadmin all"
  ON users FOR ALL
  USING (get_my_role() = 'superadmin')
  WITH CHECK (get_my_role() = 'superadmin');

CREATE POLICY "users: admin read workshop"
  ON users FOR SELECT
  USING (workshop_id = get_my_workshop_id() AND get_my_role() = 'admin');

CREATE POLICY "users: admin insert workshop"
  ON users FOR INSERT
  WITH CHECK (workshop_id = get_my_workshop_id() AND get_my_role() = 'admin');

CREATE POLICY "users: admin update workshop"
  ON users FOR UPDATE
  USING (workshop_id = get_my_workshop_id() AND get_my_role() = 'admin')
  WITH CHECK (workshop_id = get_my_workshop_id());

CREATE POLICY "users: self read"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: self update"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── CLIENTS ───────────────────────────────────────────────

CREATE POLICY "clients: workshop access"
  ON clients FOR ALL
  USING (workshop_id = get_my_workshop_id())
  WITH CHECK (workshop_id = get_my_workshop_id());

-- ── APPOINTMENTS ──────────────────────────────────────────

-- Admin & receptionist: full CRUD within workshop
CREATE POLICY "appointments: admin+receptionist all"
  ON appointments FOR ALL
  USING (
    workshop_id = get_my_workshop_id()
    AND get_my_role() IN ('admin', 'receptionist')
  )
  WITH CHECK (
    workshop_id = get_my_workshop_id()
    AND get_my_role() IN ('admin', 'receptionist')
  );

-- Mechanic: read only own assigned appointments
CREATE POLICY "appointments: mechanic read own"
  ON appointments FOR SELECT
  USING (
    workshop_id = get_my_workshop_id()
    AND mechanic_id = auth.uid()
    AND get_my_role() = 'mechanic'
  );

-- ── INVENTORY ─────────────────────────────────────────────

-- Admin & receptionist: full CRUD
CREATE POLICY "inventory: admin+receptionist all"
  ON inventory FOR ALL
  USING (
    workshop_id = get_my_workshop_id()
    AND get_my_role() IN ('admin', 'receptionist')
  )
  WITH CHECK (
    workshop_id = get_my_workshop_id()
    AND get_my_role() IN ('admin', 'receptionist')
  );

-- Mechanic: read-only
CREATE POLICY "inventory: mechanic read"
  ON inventory FOR SELECT
  USING (
    workshop_id = get_my_workshop_id()
    AND get_my_role() = 'mechanic'
  );

-- ── REPAIRS ───────────────────────────────────────────────

CREATE POLICY "repairs: admin+receptionist all"
  ON repairs FOR ALL
  USING (
    workshop_id = get_my_workshop_id()
    AND get_my_role() IN ('admin', 'receptionist')
  )
  WITH CHECK (
    workshop_id = get_my_workshop_id()
    AND get_my_role() IN ('admin', 'receptionist')
  );

-- Mechanic: read all repairs in their workshop (needed for daily work)
CREATE POLICY "repairs: mechanic read workshop"
  ON repairs FOR SELECT
  USING (
    workshop_id = get_my_workshop_id()
    AND get_my_role() = 'mechanic'
  );

-- Mechanic: update only their assigned repairs (status + fields)
CREATE POLICY "repairs: mechanic update assigned"
  ON repairs FOR UPDATE
  USING (
    workshop_id = get_my_workshop_id()
    AND mechanic_id = auth.uid()
    AND get_my_role() = 'mechanic'
  )
  WITH CHECK (
    workshop_id = get_my_workshop_id()
    AND mechanic_id = auth.uid()
  );

-- ── REPAIR_UPDATES ────────────────────────────────────────

-- Any workshop member can read updates for repairs in their workshop
CREATE POLICY "repair_updates: workshop read"
  ON repair_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repairs r
      WHERE r.id = repair_id
        AND r.workshop_id = get_my_workshop_id()
    )
  );

-- Any workshop member can insert their own updates
CREATE POLICY "repair_updates: workshop insert"
  ON repair_updates FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM repairs r
      WHERE r.id = repair_id
        AND r.workshop_id = get_my_workshop_id()
    )
  );

-- ── ACCOUNTING ────────────────────────────────────────────

CREATE POLICY "accounting: admin+receptionist all"
  ON accounting FOR ALL
  USING (
    workshop_id = get_my_workshop_id()
    AND get_my_role() IN ('admin', 'receptionist')
  )
  WITH CHECK (
    workshop_id = get_my_workshop_id()
    AND get_my_role() IN ('admin', 'receptionist')
  );

-- ============================================================
-- SEED DATA — Default SaaS plans
-- ============================================================

INSERT INTO plans (name, slug, description, price_monthly, price_yearly, trial_days, max_users, max_clients, features)
VALUES
  (
    'Starter', 'starter',
    'Perfect for small independent shops.',
    29.00, 290.00, 14, 3, 200,
    '{"appointments":true,"repairs":true,"inventory":true,"accounting":false,"landing_page":false,"api_access":false,"white_label":false}'
  ),
  (
    'Professional', 'professional',
    'For growing workshops that need the full suite.',
    79.00, 790.00, 14, 10, 1000,
    '{"appointments":true,"repairs":true,"inventory":true,"accounting":true,"landing_page":true,"api_access":false,"white_label":false}'
  ),
  (
    'Enterprise', 'enterprise',
    'Unlimited scale with white-label and API access.',
    199.00, 1990.00, 14, -1, -1,
    '{"appointments":true,"repairs":true,"inventory":true,"accounting":true,"landing_page":true,"api_access":true,"white_label":true}'
  );
