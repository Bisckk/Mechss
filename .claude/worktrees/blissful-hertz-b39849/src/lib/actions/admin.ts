'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
        return { supabase, workshopId: profileAny.workshop_id, userId: user.id }
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
            return { supabase, workshopId: workshopAny.id, userId: user.id }
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
        const { supabase, workshopId } = await getWorkshopId()

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
            .select('id, tracking_code, status, reported_issue, created_at, estimated_completion')
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
): Promise<ActionResult<{ id: string }>> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { data, error } = await supabase
            .from('repairs')
            .insert({
                workshop_id: workshopId,
                client_id: fd.client_id,
                vehicle_id: fd.vehicle_id,
                reported_issue: fd.reported_issue,
                estimated_cost: fd.estimated_cost || null,
                mechanic_id: fd.mechanic_id || null,
                vehicle_brand: fd.vehicle_brand || null,
                vehicle_model: fd.vehicle_model || null,
                vehicle_year: fd.vehicle_year || null,
                vehicle_plate: fd.vehicle_plate || null,
                status: 'received'
            } as any)
            .select('id')
            .single()

        if (error) return { ok: false, error: error.message }

        // Let's create the first update log reflecting "Created"
        await supabase.from('repair_updates').insert({
            repair_id: (data as any).id,
            user_id: (await getWorkshopId()).userId,
            status: 'received',
            notes: 'Vehículo recibido en taller.',
            photos: [],
            is_client_visible: true
        } as any)

        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
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
export async function getActiveRepairsAction(): Promise<ActionResult<any[]>> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { data, error } = await supabase
            .from('repairs')
            .select(`
                id, tracking_code, status, reported_issue, created_at,
                estimated_completion, estimated_cost, vehicle_brand, vehicle_model,
                vehicle_year, vehicle_plate, vehicle_id,
                clients:client_id ( id, full_name, phone )
            `)
            .eq('workshop_id', workshopId)
            .not('status', 'in', '("delivered","cancelled")')
            .order('created_at', { ascending: false })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
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

        revalidatePath('/admin/taller')
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
            .select('id, status, notes, photos, is_client_visible, created_at')
            .eq('repair_id', repairId)
            .order('created_at', { ascending: false })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// ── Employee Actions ───────────────────────────────────────

export async function getWorkshopEmployeesAction(): Promise<ActionResult<any[]>> {
    try {
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('users')
            .select('id, full_name, email, phone, role, is_active, created_at')
            .eq('workshop_id', workshopId)
            .in('role', ['mechanic', 'receptionist'])
            .order('created_at', { ascending: false })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data || [] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export interface CreateEmployeeData {
    full_name: string
    email: string
    phone?: string
    role: 'mechanic' | 'receptionist'
    password: string
}

export async function createEmployeeAction(fd: CreateEmployeeData): Promise<ActionResult<{ id: string }>> {
    try {
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()

        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email: fd.email,
            password: fd.password,
            email_confirm: true,
            user_metadata: { full_name: fd.full_name },
        })

        if (authError) {
            const msg = authError.message.toLowerCase()
            if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('unique')) {
                return { ok: false, error: 'Este correo ya está registrado en el sistema.' }
            }
            return { ok: false, error: authError.message }
        }

        const userId = authData.user.id

        const { error: dbError } = await admin
            .from('users')
            .insert({
                id: userId,
                workshop_id: workshopId,
                role: fd.role,
                full_name: fd.full_name,
                email: fd.email,
                phone: fd.phone || null,
                is_active: true,
            } as any)

        if (dbError) {
            await admin.auth.admin.deleteUser(userId)
            return { ok: false, error: dbError.message }
        }

        revalidatePath('/admin/empleados')
        return { ok: true, data: { id: userId } }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al crear empleado' }
    }
}

export async function toggleEmployeeStatusAction(userId: string, isActive: boolean): Promise<ActionResult<null>> {
    try {
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()

        const { data: emp } = await admin
            .from('users')
            .select('id')
            .eq('id', userId)
            .eq('workshop_id', workshopId)
            .maybeSingle()

        if (!emp) return { ok: false, error: 'Empleado no encontrado en este taller.' }

        const { error } = await admin
            .from('users')
            .update({ is_active: isActive } as any)
            .eq('id', userId)
            .eq('workshop_id', workshopId)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/empleados')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function resetEmployeePasswordAction(email: string): Promise<ActionResult<null>> {
    try {
        const admin = createAdminClient()
        const { error } = await admin.auth.admin.generateLink({
            type: 'recovery',
            email,
        })
        if (error) return { ok: false, error: error.message }
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// Create a new update/log entry for a repair (mechanic's log)
export async function createRepairUpdateAction(
    repairId: string,
    notes: string,
    photos: string[],
    isClientVisible: boolean = true
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
