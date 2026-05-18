import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendTrialExpiringEmailAction, sendSubscriptionExpiringEmailAction } from '@/lib/actions/subscription'
import { logger } from '@/lib/logger'

// Daily cron — triggered by Vercel Cron (vercel.json) or any HTTP client.
// Protect with CRON_SECRET env var.

const GRACE_DAYS = 2

function daysUntil(iso: string | null): number | null {
    if (!iso) return null
    return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export async function GET(req: NextRequest) {
    const secret = process.env.CRON_SECRET
    if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: workshops, error } = await admin
        .from('workshops')
        .select('id, name, plan_status, trial_ends_at, subscription_ends_at')
        .eq('is_active', true)

    if (error) {
        logger.error('Billing cron: failed to fetch workshops', { message: error.message })
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let deactivated = 0
    let reminded = 0

    for (const ws of workshops ?? []) {
        const status = ws.plan_status as string
        const daysLeftTrial = daysUntil(ws.trial_ends_at)
        const daysLeftSub   = daysUntil(ws.subscription_ends_at)

        // Auto-deactivate expired trial (past grace period)
        if (status === 'trial' && daysLeftTrial !== null && daysLeftTrial < -GRACE_DAYS) {
            await (admin.from('workshops') as any).update({ plan_status: 'inactive' }).eq('id', ws.id)
            logger.info('Trial expired → deactivated', { workshopId: ws.id, name: ws.name })
            deactivated++
            continue
        }

        // Auto-deactivate expired subscription (past grace period)
        if (status === 'active' && daysLeftSub !== null && daysLeftSub < -GRACE_DAYS) {
            await (admin.from('workshops') as any).update({ plan_status: 'inactive' }).eq('id', ws.id)
            logger.info('Subscription expired → deactivated', { workshopId: ws.id, name: ws.name })
            deactivated++
            continue
        }

        // Trial reminders at 7 days and 3 days
        if (status === 'trial' && daysLeftTrial !== null && (daysLeftTrial === 7 || daysLeftTrial === 3)) {
            await sendTrialExpiringEmailAction(ws.id)
            logger.info('Trial expiry reminder sent', { workshopId: ws.id, daysLeft: daysLeftTrial })
            reminded++
        }

        // Subscription reminders at 14 days and 3 days
        if (status === 'active' && daysLeftSub !== null && (daysLeftSub === 14 || daysLeftSub === 3)) {
            await sendSubscriptionExpiringEmailAction(ws.id)
            logger.info('Subscription expiry reminder sent', { workshopId: ws.id, daysLeft: daysLeftSub })
            reminded++
        }
    }

    logger.info('Billing cron finished', { deactivated, reminded, total: workshops?.length ?? 0 })
    return NextResponse.json({ ok: true, deactivated, reminded, total: workshops?.length ?? 0 })
}
