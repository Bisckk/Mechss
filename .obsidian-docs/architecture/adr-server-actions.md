---
status: active
tags: [adr, arquitectura, server-actions]
date: 2026-05-19
---

# ADR: Server Actions en lugar de API Routes

## Contexto

En Next.js 15 con App Router existen dos opciones para lógica de servidor: Route Handlers (`/api/`) y Server Actions (`'use server'`).

## Decisión

Toda lógica de negocio se implementa como Server Actions. Las Route Handlers solo se usan para:
- Webhooks entrantes de terceros (requieren POST sin CSRF token)
- Rutas que deben ser consumidas por clientes externos

## Razones

1. **Menos boilerplate** — No hay que serializar/deserializar manualmente. Los Server Actions reciben y devuelven tipos TypeScript directamente.
2. **Type safety de extremo a extremo** — El cliente llama la función tipada sin pasar por `fetch + JSON.parse`.
3. **Integración con `useTransition`** — Permite estados de carga sin estado extra en el cliente.
4. **RLS automático** — Cada action crea su propio cliente Supabase con la sesión del usuario, aplicando RLS sin código adicional.

## Consecuencias

- Los webhooks de Wompi, PayU y WhatsApp sí usan Route Handlers (`src/app/api/webhooks/`)
- Los Server Actions no son llamables desde fuera de la app (no son una API pública)

## Relacionado
- [[overview]]
- [[whatsapp]]
- [[wompi]]
