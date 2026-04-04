'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────

export interface InventoryItem {
    id: string
    workshop_id: string
    name: string
    description: string | null
    sku: string | null
    category: 'Accesorios' | 'Repuestos' | 'Líquidos y Lubricantes' | 'Herramientas' | 'Otro'
    cost_price: number
    sale_price: number
    stock_quantity: number
    is_published: boolean
    image_url: string | null
    created_at: string
}

export type SaveInventoryItemParams = Partial<Omit<InventoryItem, 'id' | 'workshop_id' | 'created_at'>>

// ── Helpers ────────────────────────────────────────────────

async function getWorkshopId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('users')
        .select('workshop_id, role')
        .eq('id', user.id)
        .single()

    const profileAny = profile as any

    if (profileAny?.workshop_id) {
        return { supabase, workshopId: profileAny.workshop_id }
    }

    if (profileAny?.role === 'superadmin') {
        const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        const workshopAny = workshop as any
        if (workshopAny?.id) {
            return { supabase, workshopId: workshopAny.id }
        }
    }

    throw new Error('No workshop assigned')
}

// ── Actions ────────────────────────────────────────────────

export async function getInventoryItemsAction(): Promise<{ ok: true; data: InventoryItem[] } | { ok: false; error: string }> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('workshop_id', workshopId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { ok: true, data: data as InventoryItem[] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function createInventoryItemAction(params: SaveInventoryItemParams): Promise<{ ok: true; data: InventoryItem } | { ok: false; error: string }> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { data, error } = await (supabase.from('inventory_items') as any).insert({
            ...params,
            workshop_id: workshopId
        }).select().single()

        if (error) throw error

        revalidatePath('/admin/inventario')
        return { ok: true, data: data as InventoryItem }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function updateInventoryItemAction(id: string, params: SaveInventoryItemParams): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { error } = await (supabase.from('inventory_items') as any)
            .update(params)
            .eq('id', id)
            .eq('workshop_id', workshopId)

        if (error) throw error

        revalidatePath('/admin/inventario')
        return { ok: true }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function deleteInventoryItemAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id)
            .eq('workshop_id', workshopId)

        if (error) throw error

        revalidatePath('/admin/inventario')
        return { ok: true }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
