'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

type ActionResult<T = null> =
    | { ok: true; data: T }
    | { ok: false; error: string }

export type NotificationType =
    | 'repair_created'
    | 'pending_completion'
    | 'client_created'
    | 'inventory_created'
    | 'appointment_created'

export type NotificationItem = {
    id: string
    type: NotificationType
    title: string
    body: string | null
    is_read: boolean
    actor_name: string | null
    metadata: Record<string, any>
    created_at: string
}

export type NotificationGroup = {
    type: NotificationType
    date: string       // YYYY-MM-DD
    count: number
    unread: number
    items: NotificationItem[]
    latest_at: string
}

async function getWorkshopId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('users')
        .select('workshop_id, role')
        .eq('id', user.id)
        .single()

    const p = profile as any

    if (p?.workshop_id) {
        return { workshopId: p.workshop_id as string, userId: user.id, supabase }
    }

    if (p?.role === 'superadmin') {
        const { data: ws } = await supabase
            .from('workshops')
            .select('id')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()
        const w = ws as any
        if (w?.id) return { workshopId: w.id as string, userId: user.id, supabase }
    }

    throw new Error('No workshop assigned')
}

// ── Internal: called by other server actions ────────────────

export async function insertNotificationAction(params: {
    workshopId: string
    actorId:    string | null
    actorName:  string | null
    type:       NotificationType
    title:      string
    body:       string | null
    metadata:   Record<string, any>
}): Promise<void> {
    try {
        const admin = createAdminClient()
        await admin.from('notifications').insert({
            workshop_id: params.workshopId,
            actor_id:    params.actorId,
            actor_name:  params.actorName,
            type:        params.type,
            title:       params.title,
            body:        params.body,
            metadata:    params.metadata,
        } as any)
    } catch {
        // Non-critical — swallow
    }
}

// ── Public Actions ─────────────────────────────────────────

export async function getNotificationsAction(): Promise<ActionResult<NotificationGroup[]>> {
    try {
        const { workshopId, supabase } = await getWorkshopId()

        const { data, error } = await supabase
            .from('notifications')
            .select('id, type, title, body, is_read, actor_name, metadata, created_at')
            .eq('workshop_id', workshopId)
            .order('created_at', { ascending: false })
            .limit(300)

        if (error) return { ok: false, error: error.message }

        const items = (data || []) as NotificationItem[]

        const groupMap = new Map<string, NotificationGroup>()

        for (const n of items) {
            const date = n.created_at.slice(0, 10)
            const key  = `${n.type}::${date}`

            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    type:      n.type,
                    date,
                    count:     0,
                    unread:    0,
                    items:     [],
                    latest_at: n.created_at,
                })
            }

            const g = groupMap.get(key)!
            g.count++
            if (!n.is_read) g.unread++
            g.items.push(n)
            if (n.created_at > g.latest_at) g.latest_at = n.created_at
        }

        const groups = Array.from(groupMap.values())
            .sort((a, b) => b.latest_at.localeCompare(a.latest_at))

        return { ok: true, data: groups }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getUnreadCountAction(): Promise<ActionResult<number>> {
    try {
        const { workshopId, supabase } = await getWorkshopId()

        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('workshop_id', workshopId)
            .eq('is_read', false)

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: count ?? 0 }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function markNotificationsReadAction(
    notificationIds?: string[]
): Promise<ActionResult<null>> {
    try {
        const { workshopId, supabase } = await getWorkshopId()

        let q = (supabase.from('notifications') as any)
            .update({ is_read: true })
            .eq('workshop_id', workshopId)

        if (notificationIds && notificationIds.length > 0) {
            q = q.in('id', notificationIds)
        } else {
            q = q.eq('is_read', false)
        }

        const { error } = await q
        if (error) return { ok: false, error: error.message }
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
