-- ============================================================
-- Migration: 00022_contabilidad_v3
-- Expansión del módulo contable: impuestos, caja, proveedores
-- Zero-Breakage Policy: solo columnas nuevas y tablas nuevas
-- Idempotente: seguro si 00016 fue o no fue aplicado antes
-- ============================================================

-- ── 1. Enums base (idempotentes) ──────────────────────────────────────────────

-- Crea transaction_status si no existe (00016 lo crea, pero puede que no esté aplicado)
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'reconciled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Crea transaction_source con 'caja' incluido si no existe.
-- Si ya existe (de 00016), el EXCEPTION lo ignora y el ADD VALUE de abajo lo completa.
DO $$ BEGIN
    CREATE TYPE transaction_source AS ENUM ('manual', 'repair_auto', 'inventory_auto', 'caja');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Agrega 'caja' si el tipo ya existía sin ese valor (caso: 00016 aplicado, 00022 no)
DO $$ BEGIN
    ALTER TYPE transaction_source ADD VALUE IF NOT EXISTS 'caja';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ── 2. Columnas en accounting ─────────────────────────────────────────────────
-- Las tres primeras cubren lo que 00016 debería haber creado (por si no se aplicó).
-- Las últimas dos son exclusivas de este módulo v3.

ALTER TABLE accounting
    ADD COLUMN IF NOT EXISTS status     transaction_status NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS source     transaction_source NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS notes      TEXT,
    ADD COLUMN IF NOT EXISTS tax_type   TEXT,
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2)      NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_accounting_status   ON accounting(status);
CREATE INDEX IF NOT EXISTS idx_accounting_source   ON accounting(source);
CREATE INDEX IF NOT EXISTS idx_accounting_category ON accounting(category);
CREATE INDEX IF NOT EXISTS idx_accounting_tax_type ON accounting(tax_type) WHERE tax_type IS NOT NULL;

-- ── 3. Tabla cash_sessions (sesiones de caja por turno) ───────────────────────

CREATE TABLE IF NOT EXISTS cash_sessions (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id         UUID          NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    user_id             UUID          NOT NULL REFERENCES auth.users(id),
    estado              TEXT          NOT NULL DEFAULT 'abierta'
                            CHECK (estado IN ('abierta', 'cerrada')),
    saldo_inicial       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (saldo_inicial >= 0),
    saldo_final_fisico  NUMERIC(12,2)           CHECK (saldo_final_fisico >= 0),
    efectivo_sistema    NUMERIC(12,2),
    diferencia          NUMERIC(12,2),
    notas               TEXT,
    abierta_en          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    cerrada_en          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_workshop_id ON cash_sessions(workshop_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_user_id     ON cash_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_estado      ON cash_sessions(workshop_id, estado);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_abierta_en  ON cash_sessions(abierta_en DESC);

ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash_sessions: workshop access" ON cash_sessions;
CREATE POLICY "cash_sessions: workshop access" ON cash_sessions
    FOR ALL USING (workshop_id = get_my_workshop_id());

-- ── 4. Tabla suppliers (proveedores del taller) ───────────────────────────────

CREATE TABLE IF NOT EXISTS suppliers (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID         NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    nombre      TEXT         NOT NULL,
    nit         TEXT,
    contacto    TEXT,
    telefono    TEXT,
    email       TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_workshop_id ON suppliers(workshop_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_activo      ON suppliers(workshop_id, activo);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers: workshop access" ON suppliers;
CREATE POLICY "suppliers: workshop access" ON suppliers
    FOR ALL USING (workshop_id = get_my_workshop_id());

-- ── 5. Tabla supplier_invoices (facturas de proveedores) ──────────────────────

CREATE TABLE IF NOT EXISTS supplier_invoices (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id       UUID          NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    supplier_id       UUID          NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    numero_factura    TEXT,
    concepto          TEXT          NOT NULL,
    monto_total       NUMERIC(12,2) NOT NULL CHECK (monto_total > 0),
    monto_pagado      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
    fecha_emision     DATE          NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    estado            TEXT          NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente', 'parcial', 'pagada', 'anulada')),
    notas             TEXT,
    created_by        UUID          REFERENCES auth.users(id),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_workshop_id  ON supplier_invoices(workshop_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id  ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_estado       ON supplier_invoices(workshop_id, estado);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_vencimiento  ON supplier_invoices(fecha_vencimiento)
    WHERE fecha_vencimiento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_created_at   ON supplier_invoices(created_at DESC);

ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supplier_invoices: workshop access" ON supplier_invoices;
CREATE POLICY "supplier_invoices: workshop access" ON supplier_invoices
    FOR ALL USING (workshop_id = get_my_workshop_id());
