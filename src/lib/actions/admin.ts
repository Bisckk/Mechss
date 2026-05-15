'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { insertNotificationAction } from '@/lib/actions/notifications'

// ── Types ──────────────────────────────────────────────────

type ActionResult<T = null> =
    | { ok: true; data: T }
    | { ok: false; error: string }

export interface CreateClientData {
    full_name: string
    phone: string
    email?: string
    address?: string
    notes?: string
}

export interface UpdateClientData {
    full_name: string
    phone: string
    email?: string
    address?: string
    notes?: string
}

export interface CreateVehicleData {
    client_id: string
    plate: string
    brand: string
    model: string
    year: number | null
    fuel_type: 'FI' | 'Carburada' | null
}

export interface CreateAppointmentData {
    client_id: string
    vehicle_id?: string | null
    vehicle_info?: string | null
    title: string
    description?: string | null
    scheduled_at: string  // ISO string
    duration_minutes?: number
    status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}

// ── Helpers ────────────────────────────────────────────────

/**
 * Used for INSERT operations that need to know the workshopId value to write.
 * Makes 2 sequential calls: auth.getUser + users.select.
 */
async function getWorkshopId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('users')
        .select('workshop_id, role')
        .eq('id', user.id)
        .single()

    const profileAny = profile as any;

    if (profileAny?.workshop_id) {
        return { supabase, workshopId: profileAny.workshop_id, userId: user.id, role: profileAny.role as string }
    }

    // Superadmin without a workshop_id: use the first active workshop
    if (profileAny?.role === 'superadmin') {
        const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        const workshopAny = workshop as any;
        if (workshopAny?.id) {
            return { supabase, workshopId: workshopAny.id, userId: user.id, role: 'superadmin' as string }
        }
    }

    throw new Error('No workshop assigned')
}

/**
 * Fast auth-only client for READ operations.
 * Skips the users.select(workshop_id) lookup — RLS policies handle
 * workshop isolation via get_my_workshop_id() at the DB level,
 * saving one sequential network round-trip per action call.
 */
async function getAuthClient() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    return { supabase, userId: user.id }
}

// ── Client Actions ─────────────────────────────────────────

export async function createClientAction(
    fd: CreateClientData
): Promise<ActionResult<{ id: string }>> {
    try {
        const { supabase, workshopId, userId } = await getWorkshopId()

        // Build OR conditions for duplicate check
        const orConditions: string[] = [
            `full_name.ilike.${fd.full_name.trim()}`,
        ]
        if (fd.phone?.trim()) orConditions.push(`phone.eq.${fd.phone.trim()}`)
        if (fd.email?.trim()) orConditions.push(`email.ilike.${fd.email.trim()}`)

        const { data: existing } = await supabase
            .from('clients')
            .select('id, full_name, phone, email')
            .eq('workshop_id', workshopId)
            .eq('is_active', true)
            .or(orConditions.join(','))
            .limit(1)
            .maybeSingle() as { data: any }

        if (existing) {
            const nameDup = existing.full_name?.toLowerCase() === fd.full_name.trim().toLowerCase()
            const phoneDup = fd.phone?.trim() && existing.phone === fd.phone.trim()
            const emailDup = fd.email?.trim() && existing.email?.toLowerCase() === fd.email.trim().toLowerCase()

            if (nameDup) return { ok: false, error: `Ya existe un cliente con el nombre "${existing.full_name}".` }
            if (phoneDup) return { ok: false, error: `El teléfono ${fd.phone} ya está registrado en otro cliente.` }
            if (emailDup) return { ok: false, error: `El correo ${fd.email} ya está registrado en otro cliente.` }
        }

        const { data, error } = await supabase
            .from('clients')
            .insert({
                workshop_id: workshopId,
                full_name: fd.full_name,
                phone: fd.phone || null,
                email: fd.email || null,
                address: fd.address || null,
                notes: fd.notes || null,
                is_active: true,
            } as any)
            .select('id')
            .single()

        if (error) return { ok: false, error: error.message }

        void insertNotificationAction({
            workshopId,
            actorId:   userId,
            actorName: null,
            type:      'client_created',
            title:     'Nuevo cliente registrado',
            body:      fd.full_name,
            metadata:  { client_id: (data as any).id, client_name: fd.full_name, phone: fd.phone || null },
        })

        revalidatePath('/admin/agenda')
        revalidatePath('/admin/clientes')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al crear cliente' }
    }
}

export async function searchClientsAction(
    query: string
): Promise<ActionResult<any[]>> {
    try {
        const { supabase } = await getAuthClient()

        // RLS policy "clients: workshop access" filters by get_my_workshop_id()
        const { data, error } = await supabase
            .from('clients')
            .select('id, full_name, email, phone')
            .eq('is_active', true)
            .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
            .limit(10)

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getRecentClientsAction(): Promise<ActionResult<any[]>> {
    try {
        const { supabase } = await getAuthClient()

        // RLS policy "clients: workshop access" filters by get_my_workshop_id()
        const { data, error } = await supabase
            .from('clients')
            .select('id, full_name, email, phone')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(8)

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function updateClientAction(
    clientId: string,
    fd: UpdateClientData
): Promise<ActionResult<null>> {
    try {
        const { supabase } = await getAuthClient()

        if (!fd.full_name.trim()) return { ok: false, error: 'El nombre es obligatorio.' }
        if (!fd.phone.trim()) return { ok: false, error: 'El teléfono es obligatorio.' }

        const { error } = await (supabase.from('clients') as any)
            .update({
                full_name: fd.full_name.trim(),
                phone:     fd.phone.trim() || null,
                email:     fd.email?.trim()   || null,
                address:   fd.address?.trim() || null,
                notes:     fd.notes?.trim()   || null,
            })
            .eq('id', clientId)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/clientes')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al actualizar cliente' }
    }
}

export async function toggleClientStatusAction(
    clientId: string,
    newStatus: boolean
): Promise<ActionResult<null>> {
    try {
        const { supabase } = await getAuthClient()

        const { error } = await (supabase.from('clients') as any)
            .update({ is_active: newStatus })
            .eq('id', clientId)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/clientes')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al cambiar estado del cliente' }
    }
}

// ── Vehicle Actions ────────────────────────────────────────

export async function createVehicleAction(
    fd: CreateVehicleData
): Promise<ActionResult<{ id: string }>> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { data, error } = await supabase
            .from('vehicles')
            .insert({
                workshop_id: workshopId,
                client_id: fd.client_id,
                plate: fd.plate.toUpperCase(),
                brand: fd.brand,
                model: fd.model,
                year: fd.year,
                fuel_type: fd.fuel_type,
                is_active: true,
            } as any)
            .select('id')
            .single()

        if (error) {
            if (error.code === '23505' || error.message.includes('unique constraint')) {
                return { ok: false, error: 'Esta placa ya se encuentra registrada en tu taller.' }
            }
            return { ok: false, error: error.message }
        }

        revalidatePath('/admin/agenda')
        revalidatePath('/admin/clientes')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al crear vehículo' }
    }
}

export async function getClientVehiclesAction(
    clientId: string
): Promise<ActionResult<any[]>> {
    try {
        const { supabase } = await getAuthClient()

        // RLS policy on vehicles filters by workshop_id via auth.uid() subquery.
        // Removing the explicit workshop_id eq() saves one sequential DB round-trip.
        const { data, error } = await supabase
            .from('vehicles')
            .select('id, plate, brand, model, year, fuel_type')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// Get repair history for a vehicle
export async function getVehicleRepairsAction(
    vehicleId: string
): Promise<ActionResult<any[]>> {
    try {
        const { supabase } = await getAuthClient()

        const { data, error } = await supabase
            .from('repairs')
            .select(`
                id, tracking_code, status, reported_issue, created_at,
                estimated_completion, estimated_cost, final_cost, vehicle_brand,
                vehicle_model, vehicle_year, vehicle_plate,
                clients:client_id ( id, full_name, phone ),
                mechanic:mechanic_id ( id, full_name )
            `)
            .eq('vehicle_id', vehicleId)
            .order('created_at', { ascending: false })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export type CreateServiceOrderData = {
    client_id: string;
    vehicle_id: string;
    reported_issue: string;
    estimated_cost?: number;
    mechanic_id?: string;
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_plate?: string;
}

// Create a new repair service order
export async function createServiceOrderAction(
    fd: CreateServiceOrderData
): Promise<ActionResult<{ id: string; tracking_code: string; workshop_name: string; workshop_slug: string; workshop_logo: string | null }>> {
    try {
        // getWorkshopId() validates the session and resolves the correct workshopId
        // (including the superadmin case). We then use the admin client for the
        // INSERT so RLS policies never block it regardless of the user's role.
        const { workshopId, userId } = await getWorkshopId()
        const adminClient = await createAdminClient()

        // Get workshop info for ticket
        const { data: workshop } = await adminClient
            .from('workshops')
            .select('name, slug, logo_url')
            .eq('id', workshopId)
            .single()

        const { data, error } = await adminClient
            .from('repairs')
            .insert({
                workshop_id:    workshopId,
                client_id:      fd.client_id,
                vehicle_id:     fd.vehicle_id,
                reported_issue: fd.reported_issue,
                estimated_cost: fd.estimated_cost || null,
                mechanic_id:    fd.mechanic_id || null,
                vehicle_brand:  fd.vehicle_brand || null,
                vehicle_model:  fd.vehicle_model || null,
                vehicle_year:   fd.vehicle_year || null,
                vehicle_plate:  fd.vehicle_plate || null,
                status: 'received',
            } as any)
            .select('id, tracking_code')
            .single()

        if (error) {
            console.error('[createServiceOrderAction] insert error:', error)
            return { ok: false, error: error.message }
        }

        // Insert the initial timeline entry — non-critical, isolated from the main result
        await adminClient.from('repair_updates').insert({
            repair_id:         (data as any).id,
            user_id:           userId,
            status:            'received',
            notes:             'Vehículo recibido en taller.',
            photos:            [],
            is_client_visible: true,
        } as any)

        void insertNotificationAction({
            workshopId,
            actorId:   userId,
            actorName: null,
            type:      'repair_created',
            title:     'Nuevo servicio registrado',
            body:      `${fd.vehicle_brand ?? ''} ${fd.vehicle_model ?? ''} · Placa ${fd.vehicle_plate ?? '—'}`.trim(),
            metadata:  {
                repair_id:      (data as any).id,
                tracking_code:  (data as any).tracking_code,
                vehicle_brand:  fd.vehicle_brand ?? null,
                vehicle_model:  fd.vehicle_model ?? null,
                vehicle_plate:  fd.vehicle_plate ?? null,
                client_id:      fd.client_id,
            },
        })

        revalidatePath('/admin/taller')
        return {
            ok: true,
            data: {
                id:            (data as any).id,
                tracking_code: (data as any).tracking_code,
                workshop_name: (workshop as any)?.name || '',
                workshop_slug: (workshop as any)?.slug || '',
                workshop_logo: (workshop as any)?.logo_url || null,
            }
        }
    } catch (e: any) {
        console.error('[createServiceOrderAction] unexpected error:', e)
        return { ok: false, error: e.message || 'Error al procesar la orden' }
    }
}

// ── Appointment Actions ────────────────────────────────────

export async function createAppointmentAction(
    fd: CreateAppointmentData
): Promise<ActionResult<{ id: string }>> {
    try {
        const { supabase, workshopId, userId } = await getWorkshopId()

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                workshop_id: workshopId,
                client_id: fd.client_id,
                vehicle_id: fd.vehicle_id || null,
                vehicle_info: fd.vehicle_info || null,
                title: fd.title,
                description: fd.description || null,
                scheduled_at: fd.scheduled_at,
                duration_minutes: fd.duration_minutes || 60,
                status: fd.status || 'pending',
                created_by: userId,
            } as any)
            .select('id')
            .single()

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/agenda')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al crear cita' }
    }
}

export async function getAppointmentsAction(): Promise<ActionResult<any[]>> {
    try {
        const { supabase } = await getAuthClient()

        // RLS policy "appointments: admin+receptionist all" filters by
        // get_my_workshop_id() + get_my_role() at the DB level.
        const { data, error } = await supabase
            .from('appointments')
            .select(`
        id, title, description, scheduled_at, duration_minutes,
        status, notes, vehicle_info, created_at,
        clients!inner ( id, full_name, phone )
      `)
            .order('scheduled_at', { ascending: true })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function updateAppointmentStatusAction(
    id: string,
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
): Promise<ActionResult> {
    try {
        const { supabase } = await getAuthClient()

        // RLS USING clause on appointments prevents updating rows outside the
        // user's workshop, so the explicit workshop_id filter is redundant.
        const { error } = await (supabase.from('appointments') as any)
            .update({ status })
            .eq('id', id)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/agenda')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al actualizar cita' }
    }
}

export interface UpdateAppointmentData {
    title: string
    description?: string | null
    scheduled_at: string
}

export async function updateAppointmentAction(
    id: string,
    data: UpdateAppointmentData
): Promise<ActionResult> {
    try {
        const { supabase } = await getAuthClient()

        // RLS handles workshop isolation — no explicit workshop_id filter needed.
        const { error } = await (supabase.from('appointments') as any)
            .update({
                title: data.title,
                description: data.description || null,
                scheduled_at: data.scheduled_at
            })
            .eq('id', id)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/agenda')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al actualizar cita' }
    }
}

// ── Workshop / Taller Actions ──────────────────────────────

// Get all active repairs (not delivered/cancelled) for the workshop
// If mechanicId is provided, only returns repairs assigned to that mechanic
export async function getActiveRepairsAction(mechanicId?: string): Promise<ActionResult<any[]>> {
    try {
        const { workshopId } = await getWorkshopId()
        // Use admin client so RLS never blocks reads regardless of user role
        const adminClient = await createAdminClient()

        let query = adminClient
            .from('repairs')
            .select(`
                id, tracking_code, status, reported_issue, created_at,
                estimated_completion, estimated_cost, final_cost, payment_status,
                vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, mechanic_id,
                clients!client_id ( id, full_name, phone ),
                mechanic:users!mechanic_id ( id, full_name )
            `)
            .eq('workshop_id', workshopId)
            .neq('status', 'delivered')
            .order('created_at', { ascending: false })

        if (mechanicId) {
            query = query.eq('mechanic_id', mechanicId)
        }

        const { data, error } = await query

        if (error) {
            console.error('[getActiveRepairsAction] error:', error)
            return { ok: false, error: error.message }
        }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        console.error('[getActiveRepairsAction] unexpected:', e)
        return { ok: false, error: e.message }
    }
}

// Update the status of a repair order
export async function updateRepairStatusAction(
    repairId: string,
    newStatus: string
): Promise<ActionResult<null>> {
    try {
        const { supabase, userId } = await getWorkshopId()

        const { error } = await (supabase.from('repairs') as any)
            .update({ status: newStatus })
            .eq('id', repairId)

        if (error) return { ok: false, error: error.message }

        // Log the status change in repair_updates
        await supabase.from('repair_updates').insert({
            repair_id: repairId,
            user_id: userId,
            status: newStatus,
            notes: `Estado actualizado a: ${newStatus}`,
            photos: [],
            is_client_visible: true
        } as any)

        revalidatePath('/admin/dashboard')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// Get all updates/logs for a specific repair
export async function getRepairUpdatesAction(
    repairId: string
): Promise<ActionResult<any[]>> {
    try {
        const { supabase } = await getAuthClient()

        const { data, error } = await supabase
            .from('repair_updates')
            .select('id, status, notes, photos, parts, is_client_visible, created_at, author:user_id(full_name)')
            .eq('repair_id', repairId)
            .order('created_at', { ascending: false })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getRepairDetailAction(repairId: string): Promise<ActionResult<any>> {
    try {
        const { supabase } = await getAuthClient()

        const { data, error } = await supabase
            .from('repairs')
            .select(`
                id, tracking_code, status, reported_issue, created_at, completed_at,
                estimated_cost, final_cost, vehicle_brand, vehicle_model,
                vehicle_year, vehicle_plate,
                clients:client_id(full_name, phone, email),
                mechanic:mechanic_id(full_name)
            `)
            .eq('id', repairId)
            .single()

        if (error) return { ok: false, error: error.message }
        return { ok: true, data }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// Actualiza campos editables de una orden: motivo, presupuesto, mecánico, fecha estimada
export async function updateRepairDetailsAction(
    repairId: string,
    campos: {
        reported_issue?: string
        estimated_cost?: number | null
        mechanic_id?: string | null
        estimated_completion?: string | null
    }
): Promise<ActionResult<null>> {
    try {
        // Verifica autenticación y obtiene el workshop del usuario
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()

        // Valida que la orden pertenezca al workshop del usuario
        const { data: repairCheck } = await admin
            .from('repairs')
            .select('id')
            .eq('id', repairId)
            .eq('workshop_id', workshopId)
            .single()

        if (!repairCheck) return { ok: false, error: 'Orden no encontrada o sin permisos.' }

        const actualizar: Record<string, any> = {}
        if (campos.reported_issue       !== undefined) actualizar.reported_issue      = campos.reported_issue
        if (campos.estimated_cost       !== undefined) actualizar.estimated_cost      = campos.estimated_cost
        if (campos.mechanic_id          !== undefined) actualizar.mechanic_id         = campos.mechanic_id
        if (campos.estimated_completion !== undefined) actualizar.estimated_completion = campos.estimated_completion || null

        const { error } = await admin
            .from('repairs')
            .update(actualizar)
            .eq('id', repairId)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/taller')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// ── Photo Upload Action ────────────────────────────────────

export async function uploadRepairPhotoAction(
    repairId: string,
    base64Data: string,
    fileName: string
): Promise<ActionResult<{ url: string }>> {
    try {
        // Verify auth first, then use admin client for storage (bypasses bucket RLS)
        await getAuthClient()
        const admin = createAdminClient()

        const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
        const buffer = Buffer.from(base64, 'base64')
        const blob = new Blob([buffer], { type: 'image/webp' })

        const baseName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
        const path = `repairs/${repairId}/${Date.now()}_${baseName}.webp`

        const { data, error } = await admin.storage
            .from('repair-photos')
            .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })

        if (error) return { ok: false, error: error.message }

        const { data: { publicUrl } } = admin.storage
            .from('repair-photos')
            .getPublicUrl(data.path)

        return { ok: true, data: { url: publicUrl } }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al subir foto' }
    }
}

// ── Employee Actions ───────────────────────────────────────

export interface CreateEmployeeData {
    full_name: string
    email: string
    phone?: string
    role: 'mechanic' | 'receptionist'
    password: string
}

export async function getWorkshopEmployeesAction(): Promise<ActionResult<any[]>> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone, role, is_active, avatar_url, created_at')
            .eq('workshop_id', workshopId)
            .in('role', ['mechanic', 'receptionist'])
            .order('created_at', { ascending: false })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function createEmployeeAction(
    fd: CreateEmployeeData
): Promise<ActionResult<{ id: string }>> {
    try {
        const { workshopId } = await getWorkshopId()
        const adminClient = createAdminClient()

        const { data, error: authErr } = await adminClient.auth.admin.createUser({
            email: fd.email,
            password: fd.password,
            email_confirm: true,
            user_metadata: {
                role: fd.role,
                workshop_id: workshopId,
                full_name: fd.full_name,
            },
        })

        if (authErr) return { ok: false, error: authErr.message }

        // Patch phone if provided (trigger may not include it)
        if (fd.phone) {
            await adminClient
                .from('users')
                .update({ phone: fd.phone })
                .eq('id', data.user.id)
        }

        revalidatePath('/admin/empleados')
        return { ok: true, data: { id: data.user.id } }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al crear empleado' }
    }
}

export async function toggleEmployeeStatusAction(
    userId: string,
    isActive: boolean
): Promise<ActionResult> {
    try {
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('users')
            .update({ is_active: isActive })
            .eq('id', userId)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/empleados')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function resetEmployeePasswordAction(
    userId: string,
    newPassword: string
): Promise<ActionResult> {
    try {
        const adminClient = createAdminClient()

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword,
            app_metadata: { must_change_password: true },
        })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getWorkshopMechanicsAction(): Promise<ActionResult<any[]>> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, phone')
            .eq('workshop_id', workshopId)
            .eq('role', 'mechanic')
            .eq('is_active', true)
            .order('full_name', { ascending: true })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// Create a new update/log entry for a repair (mechanic's log)
export async function createRepairUpdateAction(
    repairId: string,
    notes: string,
    photos: string[],
    isClientVisible: boolean = true,
    parts: { item_id: string; name: string; quantity: number; sale_price: number }[] = []
): Promise<ActionResult<{ id: string }>> {
    try {
        const { supabase, userId } = await getWorkshopId()

        // Get current repair status
        const { data: repair } = await supabase
            .from('repairs')
            .select('status')
            .eq('id', repairId)
            .single()

        const currentStatus = (repair as any)?.status || 'in_progress'

        const { data, error } = await supabase
            .from('repair_updates')
            .insert({
                repair_id: repairId,
                user_id: userId,
                status: currentStatus,
                notes,
                photos: photos || [],
                parts: parts || [],
                is_client_visible: isClientVisible
            } as any)
            .select('id')
            .single()

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/taller')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al crear actualización' }
    }
}

export async function buscarRepuestosAction(query: string): Promise<ActionResult<any[]>> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        let q = supabase
            .from('inventory_items')
            .select('id, name, sku, category, sale_price, stock_quantity, image_url')
            .eq('workshop_id', workshopId)
            .gt('stock_quantity', 0)
            .order('name', { ascending: true })
            .limit(20)

        if (query.trim()) {
            q = q.ilike('name', `%${query.trim()}%`)
        }

        const { data, error } = await q
        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// Mechanic requests completion — sets status to pending_completion
export async function solicitarCompletarAction(repairId: string): Promise<ActionResult<null>> {
    try {
        const { workshopId, userId } = await getWorkshopId()
        const admin = createAdminClient()

        // Validate the repair belongs to this workshop and is assigned to this mechanic
        const { data: repair } = await admin
            .from('repairs')
            .select('id, status, tracking_code, vehicle_brand, vehicle_model, vehicle_plate')
            .eq('id', repairId)
            .eq('workshop_id', workshopId)
            .eq('mechanic_id', userId)
            .single()

        if (!repair) return { ok: false, error: 'Orden no encontrada o no asignada a ti.' }

        const { error } = await admin
            .from('repairs')
            .update({ status: 'pending_completion' })
            .eq('id', repairId)

        if (error) return { ok: false, error: error.message }

        await admin.from('repair_updates').insert({
            repair_id: repairId,
            user_id: userId,
            status: 'pending_completion',
            notes: 'El mecánico ha marcado el servicio como finalizado. Pendiente de aprobación.',
            photos: [],
            parts: [],
            is_client_visible: false,
        } as any)

        const r = repair as any
        void insertNotificationAction({
            workshopId,
            actorId:   userId,
            actorName: null,
            type:      'pending_completion',
            title:     'Servicio listo para aprobar',
            body:      `#${r.tracking_code} · ${r.vehicle_brand ?? ''} ${r.vehicle_model ?? ''}`.trim(),
            metadata:  {
                repair_id:     repairId,
                tracking_code: r.tracking_code,
                vehicle_brand: r.vehicle_brand,
                vehicle_model: r.vehicle_model,
                vehicle_plate: r.vehicle_plate,
                mechanic_id:   userId,
            },
        })

        revalidatePath('/admin/taller')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// Edit an existing repair_update entry (mechanic can only edit their own)
export async function updateRepairUpdateAction(
    updateId: string,
    notes: string,
    parts: { item_id: string; name: string; quantity: number; sale_price: number }[]
): Promise<ActionResult<null>> {
    try {
        const { userId } = await getAuthClient()
        const admin = createAdminClient()

        const { data: update } = await admin
            .from('repair_updates')
            .select('id, user_id')
            .eq('id', updateId)
            .single()

        if (!update) return { ok: false, error: 'Registro no encontrado.' }
        if ((update as any).user_id !== userId) return { ok: false, error: 'No tienes permisos para editar este registro.' }

        const { error } = await admin
            .from('repair_updates')
            .update({ notes, parts })
            .eq('id', updateId)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/taller')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// Admin/receptionist approves completion — sets status to completed
export async function aprobarCompletarAction(repairId: string): Promise<ActionResult<null>> {
    try {
        const { workshopId, userId, role } = await getWorkshopId()

        if (role !== 'admin' && role !== 'receptionist' && role !== 'superadmin') {
            return { ok: false, error: 'Sin permisos para aprobar completados.' }
        }

        const admin = createAdminClient()

        const { data: repair } = await admin
            .from('repairs')
            .select('id, status')
            .eq('id', repairId)
            .eq('workshop_id', workshopId)
            .single()

        if (!repair) return { ok: false, error: 'Orden no encontrada.' }

        const { error } = await admin
            .from('repairs')
            .update({ status: 'completed' })
            .eq('id', repairId)

        if (error) return { ok: false, error: error.message }

        await admin.from('repair_updates').insert({
            repair_id: repairId,
            user_id: userId,
            status: 'completed',
            notes: 'Servicio aprobado y marcado como completado.',
            photos: [],
            parts: [],
            is_client_visible: true,
        } as any)

        revalidatePath('/admin/taller')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
