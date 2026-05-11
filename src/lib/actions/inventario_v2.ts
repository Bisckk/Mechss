'use server'

import { revalidatePath } from 'next/cache'
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

export interface Supplier {
    id: string
    workshop_id: string
    name: string
    contact_name: string | null
    phone: string | null
    email: string | null
    address: string | null
    payment_terms: string | null
    notes: string | null
    is_active: boolean
    created_at: string
}

export interface PurchaseOrder {
    id: string
    workshop_id: string
    supplier_id: string | null
    status: 'pending' | 'received' | 'cancelled'
    notes: string | null
    total_cost: number
    received_at: string | null
    created_at: string
    supplier?: { name: string } | null
    items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
    id: string
    purchase_order_id: string
    item_id: string | null
    item_name: string
    quantity: number
    unit_cost: number
    received_qty: number
}

export interface InventoryMovement {
    id: string
    workshop_id: string
    item_id: string
    item_name?: string
    movement_type: 'entrada' | 'salida' | 'ajuste'
    quantity: number
    unit_cost: number | null
    reference_type: string | null
    reference_id: string | null
    notes: string | null
    created_at: string
}

export interface LowStockItem {
    id: string
    name: string
    sku: string | null
    category: string
    stock_quantity: number
    min_stock: number
    deficit: number
}

// ── Proveedores ────────────────────────────────────────────

export async function getSuppliersAction(): Promise<ActionResult<Supplier[]>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('suppliers')
            .select('*')
            .eq('workshop_id', workshopId)
            .eq('is_active', true)
            .order('name', { ascending: true })
        if (error) return { ok: false, error: error.message }
        return { ok: true, data: (data || []) as Supplier[] }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function createSupplierAction(params: {
    name: string
    contact_name?: string
    phone?: string
    email?: string
    address?: string
    payment_terms?: string
    notes?: string
}): Promise<ActionResult<{ id: string }>> {
    try {
        if (!params.name?.trim()) return { ok: false, error: 'El nombre del proveedor es obligatorio.' }
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('suppliers')
            .insert({ workshop_id: workshopId, ...params } as any)
            .select('id')
            .single()
        if (error) return { ok: false, error: error.message }
        revalidatePath('/admin/inventario')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function updateSupplierAction(id: string, params: Partial<Omit<Supplier, 'id' | 'workshop_id' | 'created_at'>>): Promise<ActionResult> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { error } = await admin.from('suppliers').update(params as any).eq('id', id).eq('workshop_id', workshopId)
        if (error) return { ok: false, error: error.message }
        revalidatePath('/admin/inventario')
        return { ok: true, data: null }
    } catch (e: any) { return { ok: false, error: e.message } }
}

// ── Órdenes de Compra ──────────────────────────────────────

export async function getPurchaseOrdersAction(): Promise<ActionResult<PurchaseOrder[]>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('purchase_orders')
            .select('*, supplier:suppliers(name), items:purchase_order_items(*)')
            .eq('workshop_id', workshopId)
            .order('created_at', { ascending: false })
            .limit(50)
        if (error) return { ok: false, error: error.message }
        return { ok: true, data: (data || []) as PurchaseOrder[] }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function createPurchaseOrderAction(params: {
    supplier_id?: string
    notes?: string
    items: { item_id?: string; item_name: string; quantity: number; unit_cost: number }[]
}): Promise<ActionResult<{ id: string }>> {
    try {
        if (!params.items.length) return { ok: false, error: 'La orden debe tener al menos un producto.' }
        const { workshopId, userId } = await getCtx()
        const admin = createAdminClient()

        const total_cost = params.items.reduce((acc, i) => acc + i.quantity * i.unit_cost, 0)

        const { data: order, error: orderErr } = await admin
            .from('purchase_orders')
            .insert({ workshop_id: workshopId, supplier_id: params.supplier_id || null, notes: params.notes || null, total_cost, created_by: userId } as any)
            .select('id').single()
        if (orderErr) return { ok: false, error: orderErr.message }

        const orderId = (order as any).id
        const { error: itemsErr } = await admin.from('purchase_order_items').insert(
            params.items.map(i => ({ purchase_order_id: orderId, item_id: i.item_id || null, item_name: i.item_name, quantity: i.quantity, unit_cost: i.unit_cost } as any))
        )
        if (itemsErr) return { ok: false, error: itemsErr.message }

        revalidatePath('/admin/inventario')
        return { ok: true, data: { id: orderId } }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function receivePurchaseOrderAction(orderId: string): Promise<ActionResult> {
    try {
        const { workshopId, userId } = await getCtx()
        const admin = createAdminClient()

        // Verify belongs to workshop
        const { data: order } = await admin.from('purchase_orders').select('id, workshop_id, status').eq('id', orderId).single()
        if (!order || (order as any).workshop_id !== workshopId) return { ok: false, error: 'Orden no encontrada.' }
        if ((order as any).status !== 'pending') return { ok: false, error: 'Solo se pueden recibir órdenes pendientes.' }

        // Use the DB function
        const { error } = await admin.rpc('receive_purchase_order', { p_order_id: orderId, p_user_id: userId } as any)
        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/inventario')
        return { ok: true, data: null }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function cancelPurchaseOrderAction(orderId: string): Promise<ActionResult> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { error } = await admin
            .from('purchase_orders')
            .update({ status: 'cancelled' } as any)
            .eq('id', orderId)
            .eq('workshop_id', workshopId)
            .eq('status', 'pending')
        if (error) return { ok: false, error: error.message }
        revalidatePath('/admin/inventario')
        return { ok: true, data: null }
    } catch (e: any) { return { ok: false, error: e.message } }
}

// ── Kardex ─────────────────────────────────────────────────

export async function getInventoryMovementsAction(params?: {
    item_id?: string
    movement_type?: string
    limit?: number
}): Promise<ActionResult<InventoryMovement[]>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()

        let q = admin
            .from('inventory_movements')
            .select('*, inventory_items(name)')
            .eq('workshop_id', workshopId)
            .order('created_at', { ascending: false })
            .limit(params?.limit ?? 100)

        if (params?.item_id) q = q.eq('item_id', params.item_id)
        if (params?.movement_type) q = q.eq('movement_type', params.movement_type)

        const { data, error } = await q
        if (error) return { ok: false, error: error.message }

        const movements = ((data || []) as any[]).map(r => ({
            ...r,
            item_name: r.inventory_items?.name ?? null,
        })) as InventoryMovement[]

        return { ok: true, data: movements }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function adjustInventoryAction(params: {
    item_id: string
    quantity: number      // positivo=entrada, negativo=salida
    notes?: string
}): Promise<ActionResult> {
    try {
        const { workshopId, userId } = await getCtx()
        const admin = createAdminClient()

        if (params.quantity === 0) return { ok: false, error: 'La cantidad debe ser distinta de cero.' }

        const { data: item } = await admin.from('inventory_items').select('stock_quantity').eq('id', params.item_id).eq('workshop_id', workshopId).single()
        if (!item) return { ok: false, error: 'Producto no encontrado.' }

        const newQty = (item as any).stock_quantity + params.quantity
        if (newQty < 0) return { ok: false, error: 'El stock no puede quedar negativo.' }

        await admin.from('inventory_items').update({ stock_quantity: newQty } as any).eq('id', params.item_id)

        await admin.from('inventory_movements').insert({
            workshop_id: workshopId,
            item_id: params.item_id,
            movement_type: params.quantity > 0 ? 'entrada' : 'salida',
            quantity: params.quantity,
            reference_type: 'manual',
            notes: params.notes || 'Ajuste manual',
            created_by: userId,
        } as any)

        revalidatePath('/admin/inventario')
        return { ok: true, data: null }
    } catch (e: any) { return { ok: false, error: e.message } }
}

// ── Stock mínimo y alertas ─────────────────────────────────

export async function getLowStockItemsAction(): Promise<ActionResult<LowStockItem[]>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('inventory_items')
            .select('id, name, sku, category, stock_quantity, min_stock')
            .eq('workshop_id', workshopId)
            .filter('stock_quantity', 'lte', admin.from('inventory_items').select('min_stock') as any)

        // Manual filter since Supabase doesn't support column-vs-column filters via SDK easily
        const { data: all, error: err2 } = await admin
            .from('inventory_items')
            .select('id, name, sku, category, stock_quantity, min_stock')
            .eq('workshop_id', workshopId)

        if (err2) return { ok: false, error: err2.message }

        const lowStock = ((all || []) as any[])
            .filter(i => i.stock_quantity <= i.min_stock)
            .map(i => ({ ...i, deficit: i.min_stock - i.stock_quantity }))
            .sort((a, b) => b.deficit - a.deficit) as LowStockItem[]

        return { ok: true, data: lowStock }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function updateMinStockAction(itemId: string, minStock: number): Promise<ActionResult> {
    try {
        if (minStock < 0) return { ok: false, error: 'El stock mínimo no puede ser negativo.' }
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { error } = await admin
            .from('inventory_items')
            .update({ min_stock: minStock } as any)
            .eq('id', itemId)
            .eq('workshop_id', workshopId)
        if (error) return { ok: false, error: error.message }
        revalidatePath('/admin/inventario')
        return { ok: true, data: null }
    } catch (e: any) { return { ok: false, error: e.message } }
}
