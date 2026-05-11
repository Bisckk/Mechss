-- ─────────────────────────────────────────────────────────────────────────────
-- 00018_inventory_v2.sql — Inventario completo: stock mínimo, proveedores,
--   órdenes de compra, kardex de movimientos
-- Zero-Breakage: solo ADD COLUMN IF NOT EXISTS + nuevas tablas
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Stock mínimo en inventory_items
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 0;

-- 2. Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID          NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    name            VARCHAR(150)  NOT NULL,
    contact_name    VARCHAR(100),
    phone           VARCHAR(30),
    email           VARCHAR(150),
    address         TEXT,
    payment_terms   TEXT,
    notes           TEXT,
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_workshop_id ON suppliers(workshop_id);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers: workshop access" ON suppliers;
CREATE POLICY "suppliers: workshop access" ON suppliers
    FOR ALL USING (workshop_id = get_my_workshop_id());

-- 3. Órdenes de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID          NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    supplier_id     UUID          REFERENCES suppliers(id) ON DELETE SET NULL,
    status          TEXT          NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','received','cancelled')),
    notes           TEXT,
    total_cost      NUMERIC(12,2) NOT NULL DEFAULT 0,
    received_at     TIMESTAMPTZ,
    created_by      UUID          REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_workshop_id ON purchase_orders(workshop_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier_id ON purchase_orders(supplier_id);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchase_orders: workshop access" ON purchase_orders;
CREATE POLICY "purchase_orders: workshop access" ON purchase_orders
    FOR ALL USING (workshop_id = get_my_workshop_id());

-- 4. Items de órdenes de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID       NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id         UUID         REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name       VARCHAR(150) NOT NULL,
    quantity        INTEGER      NOT NULL CHECK (quantity > 0),
    unit_cost       NUMERIC(12,2) NOT NULL DEFAULT 0,
    received_qty    INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_poi_order_id ON purchase_order_items(purchase_order_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "poi: via order workshop" ON purchase_order_items;
CREATE POLICY "poi: via order workshop" ON purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = purchase_order_id
              AND po.workshop_id = get_my_workshop_id()
        )
    );

-- 5. Kardex — movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID          NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    item_id         UUID          NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type   TEXT          NOT NULL
                        CHECK (movement_type IN ('entrada','salida','ajuste')),
    quantity        INTEGER       NOT NULL,          -- positivo o negativo
    unit_cost       NUMERIC(12,2),
    reference_type  TEXT,                            -- 'purchase_order' | 'repair' | 'manual'
    reference_id    UUID,
    notes           TEXT,
    created_by      UUID          REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_im_workshop_id ON inventory_movements(workshop_id);
CREATE INDEX IF NOT EXISTS idx_im_item_id     ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_im_created_at  ON inventory_movements(created_at DESC);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_movements: workshop access" ON inventory_movements;
CREATE POLICY "inventory_movements: workshop access" ON inventory_movements
    FOR ALL USING (workshop_id = get_my_workshop_id());

-- 6. Función y trigger: al recibir OC → actualizar stock + registrar movimiento
CREATE OR REPLACE FUNCTION receive_purchase_order(p_order_id UUID, p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_item RECORD;
    v_workshop_id UUID;
BEGIN
    SELECT workshop_id INTO v_workshop_id FROM purchase_orders WHERE id = p_order_id;

    FOR v_item IN
        SELECT poi.item_id, poi.quantity, poi.unit_cost, poi.item_name
        FROM purchase_order_items poi
        WHERE poi.purchase_order_id = p_order_id
          AND poi.item_id IS NOT NULL
    LOOP
        -- Update stock
        UPDATE inventory_items
        SET stock_quantity = stock_quantity + v_item.quantity
        WHERE id = v_item.item_id;

        -- Log movement
        INSERT INTO inventory_movements(workshop_id, item_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
        VALUES (v_workshop_id, v_item.item_id, 'entrada', v_item.quantity, v_item.unit_cost, 'purchase_order', p_order_id, 'Recepción de orden de compra', p_user_id);
    END LOOP;

    -- Mark order as received
    UPDATE purchase_orders
    SET status = 'received', received_at = now()
    WHERE id = p_order_id;
END;
$$;
