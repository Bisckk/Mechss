-- ============================================================
-- MotoFix SaaS — Platform-level accounting table
-- Migration: 00003_platform_accounting
-- Tracks SaaS income (subscription payments) and opex
-- for the platform owner (superadmin view).
-- ============================================================

CREATE TABLE platform_accounting (
  id               UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             accounting_type NOT NULL,
  category         VARCHAR(100)    NOT NULL,
  description      TEXT            NOT NULL,
  amount           NUMERIC(10,2)   NOT NULL,
  -- Optional: link income entries to the paying workshop
  workshop_id      UUID            REFERENCES workshops(id) ON DELETE SET NULL,
  payment_method   VARCHAR(50),
  reference        VARCHAR(200),
  transaction_date DATE            NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_platform_accounting_type  ON platform_accounting(type);
CREATE INDEX idx_platform_accounting_date  ON platform_accounting(transaction_date);
CREATE INDEX idx_platform_accounting_ws    ON platform_accounting(workshop_id);

CREATE TRIGGER trg_platform_accounting_updated_at
  BEFORE UPDATE ON platform_accounting
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

ALTER TABLE platform_accounting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_accounting: superadmin only"
  ON platform_accounting FOR ALL
  USING (get_my_role() = 'superadmin')
  WITH CHECK (get_my_role() = 'superadmin');
