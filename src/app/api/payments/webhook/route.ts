import { NextRequest, NextResponse } from 'next/server'
import { activateSubscriptionAction } from '@/lib/actions/subscription'
import { checkRateLimit, getClientIp } from '@/lib/ratelimit'
import { logger } from '@/lib/logger'

// ── Payment Webhook ─────────────────────────────────────────
//
// Endpoint agnóstico a la pasarela. Envía un POST con JSON:
// {
//   "secret": "WEBHOOK_SECRET del .env",
//   "workshop_id": "uuid",
//   "plan_id": "uuid",
//   "months": 1 | 12,
//   "reference": "número de transacción (opcional)"
// }
//
// Compatible con: Wompi, PayU, Stripe, o cualquier sistema
// que pueda hacer un POST HTTP personalizado.

export async function POST(req: NextRequest) {
    const ip = getClientIp(req.headers)
    const rl = checkRateLimit(`webhook:${ip}`, 10, 60_000)

    if (!rl.allowed) {
        logger.warn('Rate limit exceeded on payment webhook', { ip })
        return NextResponse.json(
            { error: 'Too many requests' },
            {
                status: 429,
                headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
            }
        )
    }

    try {
        const body = await req.json()

        // Validate webhook secret
        const secret = process.env.WEBHOOK_SECRET
        if (!secret || body.secret !== secret) {
            logger.warn('Webhook secret mismatch', { ip })
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { workshop_id, plan_id, months, reference } = body

        if (!workshop_id || !plan_id || !months) {
            return NextResponse.json({ error: 'Missing required fields: workshop_id, plan_id, months' }, { status: 400 })
        }

        const result = await activateSubscriptionAction({
            workshopId: workshop_id,
            planId: plan_id,
            months: Number(months),
            reference,
        })

        if (!result.ok) {
            logger.error('Webhook subscription activation failed', { error: result.error, workshop_id })
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        logger.info('Webhook subscription activated', { workshop_id, plan_id, months, reference })
        return NextResponse.json({
            ok: true,
            subscription_ends_at: result.data.subscription_ends_at,
        })
    } catch (e: any) {
        logger.error('Webhook unhandled error', { message: e.message, stack: e.stack, ip })
        return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
    }
}
