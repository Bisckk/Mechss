-- ============================================================
-- Migration: 00016_accounting_v2
-- Evolución del módulo de contabilidad — solo cambios ADITIVOS
-- No elimina ni modifica columnas existentes (Zero-Breakage Policy)
-- ============================================================

-- Nuevos enums para estado y origen de transacción
DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'reconciled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_source AS ENUM ('manual', 'repair_auto', 'inventory_auto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Columnas nuevas con defaults seguros (rows existentes quedan como 'pending' / 'manual')
ALTER TABLE accounting
  ADD COLUMN IF NOT EXISTS status  transaction_status  NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS source  transaction_source  NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS notes   TEXT;

-- Índices para el dashboard financiero
CREATE INDEX IF NOT EXISTS idx_accounting_status   ON accounting(status);
CREATE INDEX IF NOT EXISTS idx_accounting_source   ON accounting(source);
CREATE INDEX IF NOT EXISTS idx_accounting_category ON accounting(category);

-- ── Trigger: asiento automático de ingreso al completar una reparación ──────

CREATE OR REPLACE FUNCTION fn_repair_income_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM 'completed')
     AND NEW.final_cost IS NOT NULL
     AND NEW.final_cost > 0
  THEN
    IF NOT EXISTS (
      SELECT 1 FROM accounting
      WHERE repair_id = NEW.id AND source = 'repair_auto'
    ) THEN
      INSERT INTO accounting (
        workshop_id, repair_id, user_id,
        type, category, description,
        amount, source, status, transaction_date
      ) VALUES (
        NEW.workshop_id,
        NEW.id,
        NEW.mechanic_id,
        'income',
        'Servicios',
        'Servicio · ' || COALESCE(NEW.tracking_code, NEW.id::TEXT),
        NEW.final_cost,
        'repair_auto',
        'reconciled',
        CURRENT_DATE
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_repair_income_entry ON repairs;
CREATE TRIGGER trg_repair_income_entry
  AFTER UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION fn_repair_income_entry();

-- ── RLS: la política existente ya cubre los nuevos campos (no se modifica) ──
-- "accounting: admin+receptionist all" sigue vigente sin cambios.
