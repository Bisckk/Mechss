'use server'

import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// VAPID must be configured — set via scripts/generate-vapid.mjs
if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export interface PushPayload {
    title: string
    body: string
    url?: string
    tag?: string
}

export async function sendPushToWorkshopAction(workshopId: string, payload: PushPayload): Promise<void> {
    if (!process.env.VAPID_PRIVATE_KEY) return  // silently skip if VAPID not configured

    try {
        const admin = createAdminClient()
        const { data: subs } = await (admin.from('push_subscriptions') as any)
            .select('endpoint, p256dh, auth')
            .eq('workshop_id', workshopId)

        if (!subs?.length) return

        const message = JSON.stringify(payload)
        const results = await Promise.allSettled(
            subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
                webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    message
                )
            )
        )

        const failed = results.filter(r => r.status === 'rejected').length
        if (failed > 0) {
            logger.warn('Some push notifications failed', { workshopId, failed, total: subs.length })
        }
    } catch (e: any) {
        logger.error('sendPushToWorkshopAction error', { message: e.message, workshopId })
    }
}
