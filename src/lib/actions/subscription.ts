'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
    sendEmail,
    buildTrialWelcomeEmail,
    buildTrialExpiringEmail,
    buildSubscriptionExpiringEmail,
    buildSubscriptionActivatedEmail,
} from '@/lib/email'

type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

// ── Plan status helpers ──────────────────────────────────────

export type PlanInfo = {
    plan_status: 'active' | 'inactive' | 'trial'
    trial_ends_at: string | null
    subscription_ends_at: string | null
    plan_name: string | null
    workshop_email: string | null
    workshop_name: string
    // Computed
    daysLeftTrial: number | null
    daysLeftSubscription: number | null
    isBlocked: boolean
    showTrialBanner: boolean
    showExpiryBanner: boolean
    bannerUrgent: boolean
}

const GRACE_DAYS = 2
const EXPIRY_WARN_DAYS = 14

function daysUntil(iso: string | null): number | null {
    if (!iso) return null
    const diff = new Date(iso).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export async function getWorkshopPlanInfo(): Promise<ActionResult<PlanInfo>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { ok: false, error: 'No autenticado' }

        const { data: profile } = await supabase
            .from('users')
            .select('role, workshop_id')
            .eq('id', user.id)
            .single() as { data: any }

        if (!profile?.workshop_id) return { ok: false, error: 'Sin taller asignado' }

        const { data: ws } = await supabase
            .from('workshops')
            .select('name, email, plan_status, trial_ends_at, subscription_ends_at, plans(name)')
            .eq('id', profile.workshop_id)
            .single() as { data: any }

        if (!ws) return { ok: false, error: 'Taller no encontrado' }

        const status = ws.plan_status as 'active' | 'inactive' | 'trial'
        const daysLeftTrial = daysUntil(ws.trial_ends_at)
        const daysLeftSubscription = daysUntil(ws.subscription_ends_at)

        const isBlocked =
            status === 'inactive' ||
            (status === 'trial' && daysLeftTrial !== null && daysLeftTrial < -GRACE_DAYS) ||
            (status === 'active' && daysLeftSubscription !== null && daysLeftSubscription < -GRACE_DAYS)

        const showTrialBanner =
            status === 'trial' &&
            daysLeftTrial !== null &&
            daysLeftTrial >= -GRACE_DAYS

        const showExpiryBanner =
            status === 'active' &&
            daysLeftSubscription !== null &&
            daysLeftSubscription <= EXPIRY_WARN_DAYS &&
            daysLeftSubscription >= -GRACE_DAYS

        const bannerUrgent =
            (showTrialBanner && daysLeftTrial !== null && daysLeftTrial <= 3) ||
            (showExpiryBanner && daysLeftSubscription !== null && daysLeftSubscription <= 3)

        return {
            ok: true,
            data: {
                plan_status: status,
                trial_ends_at: ws.trial_ends_at,
                subscription_ends_at: ws.subscription_ends_at,
                plan_name: ws.plans?.name ?? null,
                workshop_email: ws.email,
                workshop_name: ws.name,
                daysLeftTrial,
                daysLeftSubscription,
                isBlocked,
                showTrialBanner,
                showExpiryBanner,
                bannerUrgent,
            },
        }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// ── Email notifications ──────────────────────────────────────

export async function sendTrialWelcomeEmailAction(
    workshopId: string
): Promise<ActionResult> {
    try {
        const admin = createAdminClient()
        const { data: ws } = await admin
            .from('workshops')
            .select('name, email, plans(trial_days)')
            .eq('id', workshopId)
            .single() as { data: any }

        if (!ws?.email) return { ok: false, error: 'Sin email del taller' }

        await sendEmail({
            to: ws.email,
            subject: '¡Bienvenido a MotoFix! Tu prueba ha comenzado',
            html: buildTrialWelcomeEmail(ws.name, ws.plans?.trial_days ?? 14),
        })
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function sendTrialExpiringEmailAction(
    workshopId: string
): Promise<ActionResult> {
    try {
        const admin = createAdminClient()
        const { data: ws } = await admin
            .from('workshops')
            .select('name, email, trial_ends_at')
            .eq('id', workshopId)
            .single() as { data: any }

        if (!ws?.email) return { ok: false, error: 'Sin email del taller' }

        const days = daysUntil(ws.trial_ends_at) ?? 0
        await sendEmail({
            to: ws.email,
            subject: `Tu prueba de MotoFix vence ${days <= 0 ? 'hoy' : `en ${days} días`}`,
            html: buildTrialExpiringEmail(ws.name, Math.max(days, 0)),
        })
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function sendSubscriptionExpiringEmailAction(
    workshopId: string
): Promise<ActionResult> {
    try {
        const admin = createAdminClient()
        const { data: ws } = await admin
            .from('workshops')
            .select('name, email, subscription_ends_at')
            .eq('id', workshopId)
            .single() as { data: any }

        if (!ws?.email || !ws.subscription_ends_at) return { ok: false, error: 'Sin datos de suscripción' }

        const days = daysUntil(ws.subscription_ends_at) ?? 0
        await sendEmail({
            to: ws.email,
            subject: `Tu suscripción de MotoFix vence en ${days} días`,
            html: buildSubscriptionExpiringEmail(ws.name, days, ws.subscription_ends_at),
        })
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// ── Activate subscription (called from webhook) ──────────────

export async function activateSubscriptionAction(params: {
    workshopId: string
    planId: string
    months: number
    reference?: string
}): Promise<ActionResult<{ subscription_ends_at: string }>> {
    try {
        const admin = createAdminClient()

        const endsAt = new Date()
        endsAt.setMonth(endsAt.getMonth() + params.months)
        const endsAtISO = endsAt.toISOString()

        const { error } = await admin
            .from('workshops')
            .update({
                plan_id: params.planId,
                plan_status: 'active',
                subscription_ends_at: endsAtISO,
            })
            .eq('id', params.workshopId)

        if (error) return { ok: false, error: error.message }

        const { data: ws } = await admin
            .from('workshops')
            .select('name, email, plans(name)')
            .eq('id', params.workshopId)
            .single() as { data: any }

        if (ws?.email) {
            await sendEmail({
                to: ws.email,
                subject: '¡Tu plan MotoFix está activo!',
                html: buildSubscriptionActivatedEmail(ws.name, ws.plans?.name ?? 'Pro', endsAtISO),
            }).catch(() => {})
        }

        return { ok: true, data: { subscription_ends_at: endsAtISO } }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
