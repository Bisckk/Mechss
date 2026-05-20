'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
    Proveedor,
    NuevoProveedorParams,
    FacturaProveedor,
    NuevaFacturaProveedorParams,
    PagoProveedorParams,
    EstadoFacturaProveedor,
} from '@/lib/types/contabilidad'

type ActionResult<T = null> =
    | { ok: true; data: T }
    | { ok: false; error: string }

// ── Helper ─────────────────────────────────────────────────

async function getContextoAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: perfil } = await supabase
        .from('users')
        .select('workshop_id, role')
        .eq('id', user.id)
        .single()

    const p = perfil as any
    if (p?.role === 'receptionist') throw new Error('Sin permiso para gestionar proveedores.')
    if (!p?.workshop_id)            throw new Error('Sin taller asignado')

    return { workshopId: p.workshop_id as string, userId: user.id }
}

// ── Queries ────────────────────────────────────────────────

export async function getProveedoresAction(): Promise<ActionResult<Proveedor[]>> {
    try {
        const { workshopId } = await getContextoAdmin()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('suppliers')
            .select('id, name, nit, contact_name, phone, email')
            .eq('workshop_id', workshopId)
            .eq('is_active', true)
            .order('name', { ascending: true })

        if (error) return { ok: false, error: error.message }

        const ids = (data ?? []).map((r: any) => r.id as string)
        const saldoMap = new Map<string, number>()

        if (ids.length > 0) {
            const { data: facturas } = await admin
                .from('supplier_invoices')
                .select('supplier_id, total_amount, paid_amount')
                .in('supplier_id', ids)
                .neq('status', 'paid')

            for (const f of (facturas ?? []) as any[]) {
                const saldo = (Number(f.total_amount) || 0) - (Number(f.paid_amount) || 0)
                saldoMap.set(f.supplier_id, (saldoMap.get(f.supplier_id) ?? 0) + saldo)
            }
        }

        const proveedores: Proveedor[] = (data ?? []).map((r: any) => ({
            id:              r.id,
            nombre:          r.name,
            nit:             r.nit          ?? null,
            contacto:        r.contact_name ?? null,
            telefono:        r.phone        ?? null,
            email:           r.email        ?? null,
            saldo_pendiente: saldoMap.get(r.id) ?? 0,
        }))

        return { ok: true, data: proveedores }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getFacturasProveedorAction(proveedor_id?: string): Promise<ActionResult<FacturaProveedor[]>> {
    try {
        const { workshopId } = await getContextoAdmin()
        const admin = createAdminClient()

        let q = admin
            .from('supplier_invoices')
            .select('id, supplier_id, invoice_number, concept, total_amount, paid_amount, issued_at, due_date, status, suppliers(name)')
            .eq('workshop_id', workshopId)
            .order('issued_at', { ascending: false })
            .limit(50)

        if (proveedor_id) q = (q as any).eq('supplier_id', proveedor_id)

        const { data, error } = await q
        if (error) return { ok: false, error: error.message }

        const facturas: FacturaProveedor[] = (data ?? []).map((r: any) => ({
            id:                r.id,
            proveedor_id:      r.supplier_id,
            proveedor_nombre:  r.suppliers?.name ?? '—',
            numero_factura:    r.invoice_number,
            concepto:          r.concept,
            monto_total:       Number(r.total_amount) || 0,
            monto_pagado:      Number(r.paid_amount)  || 0,
            saldo_pendiente:   (Number(r.total_amount) || 0) - (Number(r.paid_amount) || 0),
            fecha_emision:     r.issued_at,
            fecha_vencimiento: r.due_date ?? null,
            estado:            r.status as EstadoFacturaProveedor,
        }))

        return { ok: true, data: facturas }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// ── Mutaciones ─────────────────────────────────────────────

export async function crearProveedorAction(params: NuevoProveedorParams): Promise<ActionResult<{ id: string }>> {
    try {
        if (!params.nombre?.trim()) return { ok: false, error: 'El nombre del proveedor es obligatorio.' }

        const { workshopId } = await getContextoAdmin()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('suppliers')
            .insert({
                workshop_id:  workshopId,
                name:         params.nombre.trim(),
                nit:          params.nit?.trim()      || null,
                contact_name: params.contacto?.trim() || null,
                phone:        params.telefono?.trim() || null,
                email:        params.email?.trim()    || null,
                is_active:    true,
            } as any)
            .select('id')
            .single()

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/contabilidad')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function crearFacturaProveedorAction(params: NuevaFacturaProveedorParams): Promise<ActionResult<{ id: string }>> {
    try {
        if (!params.concepto?.trim())                  return { ok: false, error: 'El concepto es obligatorio.' }
        if (!params.numero_factura?.trim())            return { ok: false, error: 'El número de factura es obligatorio.' }
        if (!params.monto_total || params.monto_total <= 0) return { ok: false, error: 'El monto debe ser mayor a cero.' }

        const { workshopId } = await getContextoAdmin()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('supplier_invoices')
            .insert({
                workshop_id:    workshopId,
                supplier_id:    params.proveedor_id,
                invoice_number: params.numero_factura.trim(),
                concept:        params.concepto.trim(),
                total_amount:   params.monto_total,
                paid_amount:    0,
                issued_at:      params.fecha_emision,
                due_date:       params.fecha_vencimiento || null,
                status:         'pending',
            } as any)
            .select('id')
            .single()

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/contabilidad')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function registrarPagoProveedorAction(params: PagoProveedorParams): Promise<ActionResult<null>> {
    try {
        if (!params.monto || params.monto <= 0) return { ok: false, error: 'El monto debe ser mayor a cero.' }
        if (!params.metodo_pago)                return { ok: false, error: 'Selecciona el método de pago.' }

        const { workshopId, userId } = await getContextoAdmin()
        const admin = createAdminClient()

        const { data: factura, error: fErr } = await admin
            .from('supplier_invoices')
            .select('total_amount, paid_amount, concept')
            .eq('id', params.factura_id)
            .eq('workshop_id', workshopId)
            .single()

        if (fErr || !factura) return { ok: false, error: 'Factura no encontrada.' }

        const f            = factura as any
        const nuevo_pagado = (Number(f.paid_amount) || 0) + params.monto
        const total        = Number(f.total_amount) || 0

        if (nuevo_pagado > total) {
            return { ok: false, error: 'El pago excede el saldo pendiente de la factura.' }
        }

        const nuevo_estado = nuevo_pagado >= total ? 'paid' : 'partial'

        const { error: updErr } = await admin
            .from('supplier_invoices')
            .update({ paid_amount: nuevo_pagado, status: nuevo_estado } as any)
            .eq('id', params.factura_id)

        if (updErr) return { ok: false, error: updErr.message }

        await admin.from('accounting').insert({
            workshop_id:      workshopId,
            user_id:          userId,
            type:             'expense',
            category:         'Pago Proveedor',
            description:      `Pago factura — ${f.concept as string}`,
            amount:           params.monto,
            payment_method:   params.metodo_pago,
            transaction_date: params.fecha,
            source:           'manual',
            status:           'reconciled',
            notes:            params.notas || null,
        } as any)

        revalidatePath('/admin/contabilidad')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
