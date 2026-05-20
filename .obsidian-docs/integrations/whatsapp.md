---
status: active
tags: [integración, whatsapp, webhooks, notificaciones]
date: 2026-05-19
---

# Integración: WhatsApp Business Cloud API

## Descripción

Envío de mensajes automáticos a clientes vía WhatsApp Business (Meta Cloud API). Actualmente configurado para notificaciones de estado de reparación.

## Archivos clave

| Archivo | Propósito |
|---|---|
| `src/lib/actions/whatsapp.ts` | Server actions de envío |
| `src/lib/types/integrations/whatsapp.ts` | Interfaces tipadas de API y webhooks |
| `src/app/api/webhooks/whatsapp/route.ts` | Receptor de eventos (pendiente) |
| `.obsidian-docs/integrations/whatsapp.md` | Este documento |

## Variables de entorno requeridas

Todas se leen exclusivamente desde `src/lib/config/env.ts`:

```
WHATSAPP_ACCESS_TOKEN      ← Bearer token de la app
WHATSAPP_PHONE_NUMBER_ID   ← ID del número de teléfono de negocio
WHATSAPP_WABA_ID           ← WhatsApp Business Account ID
WHATSAPP_VERIFY_TOKEN      ← Token para verificación de webhook
```

## Tipos de mensajes soportados

- **Template messages** — plantillas pre-aprobadas por Meta (estado de reparación, recordatorio de cita)
- **Text messages** — mensajes de texto libre (solo para conversaciones iniciadas por el cliente)

## Webhook events

Ver `WhatsAppWebhookPayload` en `[[src/lib/types/integrations/whatsapp.ts]]`.

Eventos relevantes:
- `messages` — mensaje entrante de un cliente
- `statuses` — confirmación de entrega/lectura de mensajes enviados

## Verificación de firma

Cada webhook entrante debe verificar `X-Hub-Signature-256` usando HMAC-SHA256 con el App Secret. Usar `[[src/lib/utils/retry.ts]]` y el verificador en el route handler.

## Flujo de envío

```
Server Action → whatsapp.ts → POST /messages (Cloud API) → respuesta tipada
```

Toda llamada pasa por `withRetry()` con máximo 3 intentos y backoff exponencial.

## Relacionado
- [[overview]] — arquitectura general
- [[taller]] — triggers de notificación al actualizar estado de orden
