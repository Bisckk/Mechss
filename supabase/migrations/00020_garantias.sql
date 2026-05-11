-- ─────────────────────────────────────────────────────────────────────────────
-- 00020_garantias.sql — Garantías post-entrega de reparaciones
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Columna delivered_at en repairs (si no existe)
ALTER TABLE repairs
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- 2. Tabla de garantías
CREATE TABLE IF NOT EXISTS garantias (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID          NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    repair_id       UUID          NOT NULL REFERENCES repairs(id)   ON DELETE CASCADE,
    valid_days      INTEGER       NOT NULL DEFAULT 30,
    issued_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ   NOT NULL,
    terms           TEXT,
    status          TEXT          NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','expired','claimed')),
    claimed_repair_id UUID        REFERENCES repairs(id) ON DELETE SET NULL,
    created_by      UUID          REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garantias_workshop  ON garantias(workshop_id);
CREATE INDEX IF NOT EXISTS idx_garantias_repair     ON garantias(repair_id);
CREATE INDEX IF NOT EXISTS idx_garantias_expires_at ON garantias(expires_at);
CREATE INDEX IF NOT EXISTS idx_garantias_status     ON garantias(status);

ALTER TABLE garantias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "garantias: workshop access" ON garantias;
CREATE POLICY "garantias: workshop access" ON garantias
    FOR ALL USING (workshop_id = get_my_workshop_id());

-- 3. Función que expira garantías automáticamente (ejecutada por un job o cron en app)
CREATE OR REPLACE FUNCTION expire_garantias()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE garantias
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < now();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
