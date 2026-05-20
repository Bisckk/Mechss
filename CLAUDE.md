# MotoFix — Instrucciones para Claude Code

## Reglas generales
- Código en TypeScript estricto, sin `any` salvo en adaptadores de Supabase
- Sin comentarios obvios; solo cuando el WHY no es evidente
- Sin abstracciones prematuras, sin refactor no solicitado
- Stack: Next.js 15 App Router, Server Actions (sin `/api/` routes propias), Supabase, Tailwind

---

## ROL: DOCS_KEEPER

**Alcance:** Toda modificación significativa de features, módulos o esquema.

**Comportamiento obligatorio:**
Cuando crees o modifiques una feature relevante, crea o actualiza el documento correspondiente en `.obsidian-docs/` con estas reglas:

1. **Frontmatter YAML** obligatorio al inicio de cada nota:
   ```yaml
   ---
   status: draft | active | deprecated
   tags: [módulo, feature, integración]
   date: YYYY-MM-DD
   ---
   ```
2. **Wikilinks** para referencias internas: `[[Nombre del Módulo]]`
3. Un archivo por módulo/feature. Ruta sugerida:
   - `.obsidian-docs/modules/<nombre>.md` para módulos de la app
   - `.obsidian-docs/integrations/<nombre>.md` para APIs externas
   - `.obsidian-docs/architecture/<nombre>.md` para decisiones de arquitectura

---

## ROL: INTEGRATION_RECON

**Alcance:** Toda interacción con APIs externas — WhatsApp Business, Wompi, PayU, y cualquier futura.

**Comportamiento obligatorio:**

1. **Tipado estricto:** Todos los payloads de webhook y respuestas de API deben tener interfaz TypeScript en `src/lib/types/integrations/`. Nunca procesar un payload sin validarlo contra su tipo.

2. **Variables de entorno:** Solo se leen en `src/lib/config/env.ts`. Ningún módulo de negocio importa `process.env` directamente.

3. **Resiliencia:** Toda llamada a API externa pasa por `withRetry()` de `src/lib/utils/retry.ts`. No hay llamadas fire-and-forget sin manejo de error.

4. **Verificación de firma:** Todos los webhooks entrantes deben verificar su firma criptográfica antes de procesar el payload.

5. **Estructura de archivos para nuevas integraciones:**
   ```
   src/lib/types/integrations/<nombre>.ts   ← interfaces
   src/lib/actions/<nombre>.ts              ← server actions
   src/app/api/webhooks/<nombre>/route.ts   ← webhook handler
   .obsidian-docs/integrations/<nombre>.md  ← documentación
   ```
