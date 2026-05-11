'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

async function getCtx() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    const { data: perfil } = await supabase.from('users').select('workshop_id, role').eq('id', user.id).single()
    const workshopId = (perfil as any)?.workshop_id
    if (!workshopId) throw new Error('Sin taller asignado')
    return { workshopId, userId: user.id, role: (perfil as any)?.role as string }
}

// ── Types ──────────────────────────────────────────────────

export interface WhatsAppConfig {
    id: string
    workshop_id: string
    phone_number_id: string | null
    access_token: string | null
    webhook_verify_token: string | null
    enabled: boolean
    send_on_received: boolean
    send_on_completed: boolean
    send_on_delivered: boolean
    send_appointment_reminder: boolean
}

export interface SaveWhatsAppConfigParams {
    phone_number_id: string
    access_token: string
    webhook_verify_token?: string
    enabled: boolean
    send_on_received: boolean
    send_on_completed: boolean
    send_on_delivered: boolean
    send_appointment_reminder: boolean
}

// ── Config actions ─────────────────────────────────────────

export async function getWhatsAppConfigAction(): Promise<ActionResult<WhatsAppConfig | null>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('whatsapp_config')
            .select('*')
            .eq('workshop_id', workshopId)
            .maybeSingle()
        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data as WhatsAppConfig | null }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function saveWhatsAppConfigAction(params: SaveWhatsAppConfigParams): Promise<ActionResult> {
    try {
        if (params.enabled && !params.phone_number_id) return { ok: false, error: 'El Phone Number ID es obligatorio para activar WhatsApp.' }
        if (params.enabled && !params.access_token) return { ok: false, error: 'El Token de acceso es obligatorio para activar WhatsApp.' }

        const { workshopId } = await getCtx()
        const admin = createAdminClient()

        const { error } = await admin
            .from('whatsapp_config')
            .upsert({
                workshop_id: workshopId,
                ...params,
                updated_at: new Date().toISOString(),
            } as any, { onConflict: 'workshop_id' })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: null }
    } catch (e: any) { return { ok: false, error: e.message } }
}

// ── Messaging ─────────────────────────────────────────────

export type WaTemplate = 'ingreso_orden' | 'presupuesto_listo' | 'orden_completada' | 'recordatorio_cita'

const TEMPLATE_NAMES: Record<WaTemplate, string> = {
    ingreso_orden:       'ingreso_orden',
    presupuesto_listo:   'presupuesto_listo',
    orden_completada:    'orden_completada',
    recordatorio_cita:   'recordatorio_cita',
}

function buildMessagePayload(template: WaTemplate, to: string, vars: string[]) {
    return {
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9]/g, ''),
        type: 'template',
        template: {
            name: TEMPLATE_NAMES[template],
            language: { code: 'es' },
            components: vars.length > 0 ? [{
                type: 'body',
                parameters: vars.map(v => ({ type: 'text', text: v })),
            }] : [],
        },
    }
}

export async function sendWhatsAppMessageAction(params: {
    workshopId: string
    repairId: string | null
    phone: string
    template: WaTemplate
    variables: string[]
}): Promise<ActionResult<{ messageId: string | null }>> {
    try {
        const admin = createAdminClient()

        // Load config
        const { data: cfg } = await admin
            .from('whatsapp_config')
            .select('phone_number_id, access_token, enabled')
            .eq('workshop_id', params.workshopId)
            .maybeSingle()

        const config = cfg as any
        if (!config?.enabled || !config?.phone_number_id || !config?.access_token) {
            return { ok: false, error: 'WhatsApp no está configurado o desactivado.' }
        }

        const payload = buildMessagePayload(params.template, params.phone, params.variables)

        const res = await fetch(
            `https://graph.facebook.com/v20.0/${config.phone_number_id}/messages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.access_token}`,
                },
                body: JSON.stringify(payload),
            }
        )

        const responseBody = await res.json()
        const messageId = responseBody?.messages?.[0]?.id ?? null
        const errorMsg  = !res.ok ? (responseBody?.error?.message ?? 'Error de Meta API') : null

        // Log the message
        await admin.from('whatsapp_messages').insert({
            workshop_id:   params.workshopId,
            repair_id:     params.repairId,
            phone:         params.phone,
            template_name: params.template,
            payload,
            status:        res.ok ? 'sent' : 'failed',
            meta_message_id: messageId,
            error_msg:     errorMsg,
        } as any)

        if (!res.ok) return { ok: false, error: errorMsg ?? 'Error de Meta API' }
        return { ok: true, data: { messageId } }
    } catch (e: any) { return { ok: false, error: e.message } }
}

// ── Helpers para disparar por evento ──────────────────────

export async function notifyRepairReceivedAction(params: {
    workshopId: string
    repairId: string
    phone: string
    trackingCode: string
    vehicleDesc: string
}): Promise<void> {
    const cfg = await getWhatsAppConfigForWorkshop(params.workshopId)
    if (!cfg?.enabled || !cfg?.send_on_received) return

    await sendWhatsAppMessageAction({
        workshopId: params.workshopId,
        repairId: params.repairId,
        phone: params.phone,
        template: 'ingreso_orden',
        variables: [params.vehicleDesc, params.trackingCode],
    })
}

export async function notifyRepairCompletedAction(params: {
    workshopId: string
    repairId: string
    phone: string
    vehicleDesc: string
    trackingCode: string
}): Promise<void> {
    const cfg = await getWhatsAppConfigForWorkshop(params.workshopId)
    if (!cfg?.enabled || !cfg?.send_on_completed) return

    await sendWhatsAppMessageAction({
        workshopId: params.workshopId,
        repairId: params.repairId,
        phone: params.phone,
        template: 'orden_completada',
        variables: [params.vehicleDesc, params.trackingCode],
    })
}

async function getWhatsAppConfigForWorkshop(workshopId: string) {
    const admin = createAdminClient()
    const { data } = await admin
        .from('whatsapp_config')
        .select('enabled, send_on_received, send_on_completed, send_on_delivered')
        .eq('workshop_id', workshopId)
        .maybeSingle()
    return data as any
}
