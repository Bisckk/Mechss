---
status: draft
tags: [integración, wompi, pagos, colombia]
date: 2026-05-19
---

# Integración: Wompi (Colombia)

## Descripción

Pasarela de pagos colombiana. Pendiente de implementación (Fase 8 del roadmap). Soporta Nequi, PSE, tarjetas, Bancolombia QR y Efecty.

## Archivos clave

| Archivo | Propósito |
|---|---|
| `src/lib/types/integrations/wompi.ts` | Interfaces tipadas de webhooks y API |
| `src/app/api/webhooks/wompi/route.ts` | Receptor de eventos (pendiente) |
| `src/lib/actions/pagos.ts` | Actions de pagos (estructura base existe) |

## Variables de entorno requeridas

```
WOMPI_PUBLIC_KEY       ← Llave pública (uso en cliente)
WOMPI_PRIVATE_KEY      ← Llave privada (solo servidor)
WOMPI_EVENTS_SECRET    ← Secret para verificar firma de webhooks
WOMPI_INTEGRITY_SECRET ← Secret para generar firma de transacciones
```

## Webhook events

Ver `WompiWebhookEvent` en `src/lib/types/integrations/wompi.ts`.

Evento principal: `transaction.updated`

Estados de transacción:
- `APPROVED` — pago exitoso
- `DECLINED` — rechazado
- `VOIDED` — reversado
- `ERROR` — error técnico
- `PENDING` — en proceso (PSE/Nequi)

## Verificación de firma

El evento incluye `signature.checksum` (SHA256 de las propiedades concatenadas + timestamp + secret). **Rechazar** cualquier webhook que no pase verificación.

## Flujos pendientes de implementar

1. **Pago de suscripción de taller** — link de pago Wompi → webhook confirma → actualizar `subscription_status`
2. **Pago de servicio por cliente** — generar link de pago asociado a una `repair`

## Relacionado
- [[contabilidad]] — los pagos aprobados generan transacciones automáticas
- [[payu]] — alternativa regional
- [[adr-server-actions]]
