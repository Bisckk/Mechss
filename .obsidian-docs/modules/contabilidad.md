---
status: active
tags: [contabilidad, finanzas, caja, impuestos, proveedores, reportes]
date: 2026-05-20
---

# Módulo de Contabilidad

## Descripción

Módulo financiero completo del taller. Gestiona ingresos, egresos, control de caja por turno, cuentas por cobrar (cartera), cuentas por pagar (proveedores), impuestos y reportes financieros.

---

## Jerarquía de Roles

| Función                        | admin / superadmin | receptionist |
|--------------------------------|--------------------|--------------|
| Ver resumen financiero         | ✅                 | ❌           |
| Ver flujo de caja y gráficos   | ✅                 | ❌           |
| Ver cartera pendiente          | ✅                 | ❌           |
| Registrar ingresos             | ✅                 | ✅           |
| Registrar egresos              | ✅                 | ❌           |
| Anular transacciones           | ✅                 | ❌           |
| Abonar a cartera               | ✅                 | ✅           |
| Abrir / cerrar caja (propio)   | ✅                 | ✅           |
| Ver historial de cajas         | ✅ (todas)         | ✅ (propio)  |
| Gestionar proveedores          | ✅                 | ❌           |
| Ver / pagar facturas proveedor | ✅                 | ❌           |
| Ver resumen de impuestos       | ✅                 | ❌           |
| Exportar CSV / PDF             | ✅                 | ❌           |
| Ver Estado de Resultados P&G   | ✅                 | ❌           |

---

## Estructura de Archivos

```
src/lib/types/contabilidad.ts
src/lib/actions/contabilidad.ts        ← transacciones, cartera, impuestos, P&G
src/lib/actions/caja.ts                ← sesiones de caja
src/lib/actions/proveedores.ts         ← CRUD proveedores y facturas
src/app/(dashboard)/admin/contabilidad/
  page.tsx                             ← server component, control de roles
  ContabilidadClient.tsx               ← shell con sistema de tabs
  tabs/
    TabResumen.tsx                     ← KPIs, gráficos, cartera con abonos
    TabMovimientos.tsx                 ← lista y creación de transacciones
    TabCaja.tsx                        ← apertura, cierre y arqueo
    TabProveedores.tsx                 ← CRUD proveedores y pago de facturas
    TabImpuestos.tsx                   ← resumen fiscal IVA / ICA / retenciones
    TabReportes.tsx                    ← P&G, exportaciones PDF/CSV
src/lib/utils/reportes.ts              ← printBalanceMensual, printEstadoResultados, printReporteImpuestos
src/lib/utils/exportar.ts              ← exportTransacciones, exportLibroDiario
```

---

## SQL Requerido

### Columnas nuevas en `accounting`
```sql
ALTER TABLE accounting
ADD COLUMN IF NOT EXISTS tax_type   TEXT,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0;
```

### Tabla `cash_sessions`
```sql
CREATE TABLE cash_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id      UUID NOT NULL REFERENCES workshops(id),
    user_id          UUID NOT NULL REFERENCES users(id),
    user_name        TEXT NOT NULL,
    opening_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
    closing_balance  NUMERIC(12,2),
    total_cash_in    NUMERIC(12,2) DEFAULT 0,
    total_cash_out   NUMERIC(12,2) DEFAULT 0,
    difference       NUMERIC(12,2),
    status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at        TIMESTAMPTZ,
    notes            TEXT,
    closing_notes    TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cash_sessions_workshop ON cash_sessions(workshop_id);
CREATE INDEX idx_cash_sessions_user     ON cash_sessions(user_id);
```

### Tabla `suppliers`
```sql
CREATE TABLE suppliers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id  UUID NOT NULL REFERENCES workshops(id),
    name         TEXT NOT NULL,
    nit          TEXT,
    contact_name TEXT,
    phone        TEXT,
    email        TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_suppliers_workshop ON suppliers(workshop_id);
```

### Tabla `supplier_invoices`
```sql
CREATE TABLE supplier_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id     UUID NOT NULL REFERENCES workshops(id),
    supplier_id     UUID NOT NULL REFERENCES suppliers(id),
    invoice_number  TEXT NOT NULL,
    concept         TEXT NOT NULL,
    total_amount    NUMERIC(12,2) NOT NULL,
    paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
    issued_at       DATE NOT NULL,
    due_date        DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_supplier_invoices_workshop ON supplier_invoices(workshop_id);
CREATE INDEX idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
```

---

## Impuestos Soportados

| Tipo                   | Tasa default | Notas                          |
|------------------------|-------------|--------------------------------|
| IVA                    | 19%         | Servicios y repuestos          |
| ICA                    | 1%          | Industria y comercio municipal |
| Retención en la Fuente | 3.5%        | Pagos a terceros               |
| Impoconsumo            | 8%          | Productos de consumo           |

`amount` en `accounting` = monto base + impuesto. `tax_amount` almacena solo el componente tributario.

---

## Facturación Electrónica DIAN

**Estado:** Pendiente de activación por solicitud del cliente.

La lógica de tipos está preparada. Cuando el cliente solicite habilitación:
1. Obtener credenciales del operador DIAN autorizado.
2. Crear `src/lib/types/integrations/dian.ts`.
3. Crear `src/lib/actions/facturacion.ts` usando `withRetry()` de [[retry]].
4. Crear webhook en `src/app/api/webhooks/dian/route.ts` con verificación de firma.

---

## Exportaciones

| Reporte                  | Formato | Función                   |
|--------------------------|---------|---------------------------|
| Balance mensual          | PDF     | `printBalanceMensual()`   |
| Estado de Resultados P&G | PDF     | `printEstadoResultados()` |
| Reporte fiscal           | PDF     | `printReporteImpuestos()` |
| Transacciones            | CSV     | `exportTransacciones()`   |
| Libro diario auxiliar    | CSV     | `exportLibroDiario()`     |

---

## Relacionados

- [[inventario]] — el costo de inventario alimenta el COGS en el P&G
- [[ordenes]] — órdenes completadas generan entradas en cartera pendiente
- [[retry]] — llamadas externas deben pasar por `withRetry()`
