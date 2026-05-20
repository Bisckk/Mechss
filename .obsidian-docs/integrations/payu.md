---
status: draft
tags: [integración, payu, pagos, latam]
date: 2026-05-19
---

# Integración: PayU (LatAm)

## Descripción

Pasarela de pagos regional para Latinoamérica. Alternativa a [[wompi]] para talleres fuera de Colombia. Pendiente de implementación.

## Archivos clave

| Archivo | Propósito |
|---|---|
| `src/lib/types/integrations/payu.ts` | Interfaces tipadas de IPN y API |
| `src/app/api/webhooks/payu/route.ts` | Receptor de IPN (pendiente) |

## Variables de entorno requeridas

```
PAYU_MERCHANT_ID   ← ID de comercio
PAYU_API_KEY       ← Llave de API
PAYU_API_LOGIN     ← Login de API
PAYU_ACCOUNT_ID    ← ID de cuenta
PAYU_TEST_MODE     ← '0' prod | '1' sandbox
```

## IPN (Instant Payment Notification)

PayU envía un POST con `application/x-www-form-urlencoded` (no JSON). Ver `PayUIPNPayload` en `src/lib/types/integrations/payu.ts`.

### Estados (`state_pol`)
| Código | Estado |
|---|---|
| `4` | APPROVED |
| `6` | DECLINED |
| `5` | EXPIRED |
| `7` | PENDING |
| `104` | ERROR |

## Verificación de firma

```
md5(apiKey~merchantId~referenceCode~amount~currency~statePol)
```

Comparar contra el campo `sign` recibido. Rechazar si no coincide.

## Métodos de pago soportados

Tarjeta crédito/débito, PSE, Baloto, referenciado bancario, Efecty, DaviPlata.

## Relacionado
- [[wompi]] — alternativa para Colombia
- [[contabilidad]] — pagos aprobados generan transacciones
