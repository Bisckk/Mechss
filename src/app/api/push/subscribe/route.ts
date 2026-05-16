import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/ratelimit'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
    const ip = getClientIp(req.headers)
    const rl = checkRateLimit(`push-sub:${ip}`, 20, 60_000)
    if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('users')
            .select('workshop_id')
            .eq('id', user.id)
            .single()

        if (!(profile as any)?.workshop_id) {
            return NextResponse.json({ error: 'No workshop associated' }, { status: 400 })
        }

        const body = await req.json()
        const { endpoint, keys } = body
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
        }

        const admin = createAdminClient()
        const { error } = await (admin.from('push_subscriptions') as any).upsert(
            {
                workshop_id: (profile as any).workshop_id,
                user_id:     user.id,
                endpoint,
                p256dh:      keys.p256dh,
                auth:        keys.auth,
            },
            { onConflict: 'user_id,endpoint' }
        )

        if (error) {
            logger.error('Push subscription upsert failed', { message: error.message })
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (e: any) {
        logger.error('Push subscribe route error', { message: e.message })
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        if (!body?.endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

        const admin = createAdminClient()
        await (admin.from('push_subscriptions') as any)
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', body.endpoint)

        return NextResponse.json({ ok: true })
    } catch (e: any) {
        logger.error('Push unsubscribe route error', { message: e.message })
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
