-- ─────────────────────────────────────────────────────────────────────────────
-- 00017_payments.sql — Tabla de pagos y estado de cobro en órdenes
-- Zero-Breakage: solo columnas nuevas con DEFAULT; sin renombrar ni eliminar.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Columna payment_status en repairs (si no existe)
ALTER TABLE repairs
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending','partial','paid','refunded'));

-- 2. Tabla payments
CREATE TABLE IF NOT EXISTS payments (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID         NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    repair_id       UUID         NOT NULL REFERENCES repairs(id)   ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method  TEXT         NOT NULL DEFAULT 'efectivo'
                        CHECK (payment_method IN ('efectivo','transferencia','tarjeta','credito')),
    reference       TEXT,
    notes           TEXT,
    created_by      UUID         REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_repair_id    ON payments(repair_id);
CREATE INDEX IF NOT EXISTS idx_payments_workshop_id  ON payments(workshop_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at   ON payments(created_at DESC);

-- 3. RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments: workshop access" ON payments;
CREATE POLICY "payments: workshop access" ON payments
    FOR ALL USING (workshop_id = get_my_workshop_id());

-- 4. Función que mantiene payment_status actualizado
CREATE OR REPLACE FUNCTION update_repair_payment_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_repair_id  UUID;
    v_total_paid NUMERIC;
    v_cost       NUMERIC;
    v_status     TEXT;
BEGIN
    v_repair_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.repair_id ELSE NEW.repair_id END;

    SELECT COALESCE(SUM(amount), 0)
    INTO   v_total_paid
    FROM   payments
    WHERE  repair_id = v_repair_id;

    SELECT COALESCE(final_cost, estimated_cost, 0)
    INTO   v_cost
    FROM   repairs
    WHERE  id = v_repair_id;

    IF    v_cost > 0 AND v_total_paid >= v_cost THEN v_status := 'paid';
    ELSIF v_total_paid > 0                       THEN v_status := 'partial';
    ELSE                                              v_status := 'pending';
    END IF;

    UPDATE repairs SET payment_status = v_status WHERE id = v_repair_id;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- 5. Trigger sobre payments
DROP TRIGGER IF EXISTS trg_update_repair_payment_status ON payments;
CREATE TRIGGER trg_update_repair_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_repair_payment_status();

-- 6. Habilitar Realtime para la tabla payments
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
