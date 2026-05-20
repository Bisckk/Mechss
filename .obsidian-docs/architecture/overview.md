---
status: active
tags: [arquitectura, stack, multi-tenant]
date: 2026-05-19
---

# Arquitectura General — MotoFix

## Stack

| Capa | Tecnología |
|---|---|
| Frontend / SSR | Next.js 15.1, App Router, TypeScript |
| Base de datos | Supabase (PostgreSQL + Auth + Storage) |
| Estilos | Tailwind CSS |
| Animaciones | GSAP |
| Gráficos | Recharts |
| Push notifications | Web Push API + VAPID |
| Email | Nodemailer |
| Despliegue | Vercel |

## Patrón principal: Server Actions

No se usan `/api/` routes propias para lógica de negocio. Todo corre en Server Actions (`'use server'`) que acceden directamente a Supabase con el cliente de servicio (`createAdminClient`). Las únicas rutas API son para webhooks entrantes (`src/app/api/webhooks/`).

## Multi-tenancy

Aislamiento por `workshop_id` en todas las tablas. Implementado con Row Level Security (RLS) en Supabase. Cada taller solo ve sus datos. Ver [[database]] para el esquema.

## Roles de usuario

| Rol | Acceso |
|---|---|
| `superadmin` | Panel global, todos los talleres, facturación de plataforma |
| `admin` | Dashboard completo del taller |
| `receptionist` | Taller, clientes, agenda (sin contabilidad) |
| `mechanic` | Sus órdenes asignadas + actualizaciones de estado |

El middleware en `src/middleware.ts` valida el rol en cada ruta protegida.

## Estructura de directorios clave

```
src/
  app/
    (auth)/          ← rutas públicas de autenticación
    (dashboard)/
      admin/         ← panel del taller
      superadmin/    ← panel de plataforma
    api/
      webhooks/      ← receptores de eventos externos
    t/[slug]/        ← landing pages públicas por taller
    rastreo/         ← tracking público de órdenes
  lib/
    actions/         ← Server Actions (toda la lógica de negocio)
    types/           ← interfaces TypeScript
    utils/           ← helpers puros (reportes, exportar, retry)
    config/          ← variables de entorno tipadas
    supabase/        ← clientes de Supabase (server/client)
  components/
    admin/           ← componentes por módulo
    ui/              ← design system interno
```

## Relacionado
- [[database]]
- [[adr-server-actions]]
