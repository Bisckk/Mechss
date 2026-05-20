---
status: active
tags: [índice, navegación]
date: 2026-05-19
---

# MotoFix — Mapa de Documentación

Plataforma SaaS B2B multi-tenant para gestión de talleres de motos/vehículos en Latinoamérica.

## Arquitectura
- [[overview]] — Stack, patrones, multi-tenancy, roles
- [[database]] — Esquema de tablas y relaciones clave

## Módulos del Admin
- [[taller]] — Órdenes de trabajo, estados, flujo de reparación
- [[clientes]] — Gestión de clientes y vehículos
- [[inventario]] — Inventario v2, proveedores, compras, kardex
- [[contabilidad]] — Transacciones, flujo de caja, cartera
- [[agenda]] — Citas y programación
- [[empleados]] — Gestión de personal
- [[configuracion]] — WhatsApp, push, 2FA, suscripción

## Integraciones Externas
- [[whatsapp]] — WhatsApp Business Cloud API
- [[wompi]] — Pasarela de pagos Wompi (Colombia)
- [[payu]] — Pasarela de pagos PayU (LatAm)

## Decisiones de Arquitectura
- [[adr-server-actions]] — Por qué Server Actions en lugar de API routes
- [[adr-inventario-v2]] — Migración de inventory.ts v1 a inventario_v2.ts
