---
status: active
tags: [módulo, inventario, compras, kardex]
date: 2026-05-19
---

# Módulo: Inventario

## Descripción

Sistema de inventario v2 para gestión de productos, proveedores y movimientos de stock. Reemplaza completamente a `inventory.ts` v1 (eliminado).

## Archivos clave

| Archivo | Propósito |
|---|---|
| `src/lib/actions/inventario_v2.ts` | Todas las server actions del módulo |
| `src/app/(dashboard)/admin/inventario/page.tsx` | Vista principal (productos) |
| `src/app/(dashboard)/admin/inventario/compras/page.tsx` | Registro de compras |
| `src/app/(dashboard)/admin/inventario/kardex/page.tsx` | Historial de movimientos |
| `src/app/(dashboard)/admin/inventario/proveedores/page.tsx` | Gestión de proveedores |

## Entidades

### `inventory_items` — Productos
- `id`, `workshop_id`, `name`, `sku`, `category`, `cost_price`, `sale_price`, `stock_quantity`, `min_stock`, `is_published`, `image_url`
- Categorías: `Accesorios` | `Repuestos` | `Líquidos y Lubricantes` | `Herramientas` | `Otro`

### Proveedores
- Asociados a items para auto-generación de órdenes de compra (pendiente — [[roadmap]])

### Kardex
- Registro de movimientos: entradas (compras), salidas (usados en reparaciones), ajustes manuales

## Server Actions disponibles

- `getInventoryItemsAction()` — lista con filtro por taller
- `createInventoryItemAction(params)` — crea item + notificación in-app
- `updateInventoryItemAction(id, params)` — actualiza campos
- `deleteInventoryItemAction(id)` — elimina con verificación de workshop
- `updateMinStockAction(itemId, minStock)` — ajuste de stock mínimo

## Alertas de stock

El sidebar muestra badge cuando algún item está por debajo de `min_stock`. Ver `getInventarioBadgeAction()` en `inventario_v2.ts`.

## ADR: migración v1 → v2

[[adr-inventario-v2]]

## Relacionado
- [[contabilidad]] — las compras de inventario generan transacciones automáticas
- [[taller]] — los repuestos usados en reparaciones descuentan stock
