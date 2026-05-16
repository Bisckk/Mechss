import { NextRequest, NextResponse } from 'next/server'
import { activateSubscriptionAction } from '@/lib/actions/subscription'

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
    try {
        const body = await req.json()

        // Validate webhook secret
        const secret = process.env.WEBHOOK_SECRET
        if (!secret || body.secret !== secret) {
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
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
            ok: true,
            subscription_ends_at: result.data.subscription_ends_at,
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
    }
}
