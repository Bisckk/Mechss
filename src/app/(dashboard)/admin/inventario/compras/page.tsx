import { getPurchaseOrdersAction, getSuppliersAction } from '@/lib/actions/inventario_v2'
import { getInventoryItemsAction } from '@/lib/actions/inventario_v2'
import ComprasClient from './ComprasClient'

export default async function ComprasPage() {
    const [ordersRes, suppliersRes, itemsRes] = await Promise.all([
        getPurchaseOrdersAction(),
        getSuppliersAction(),
        getInventoryItemsAction(),
    ])

    return (
        <ComprasClient
            initialOrders={ordersRes.ok ? ordersRes.data : []}
            suppliers={suppliersRes.ok ? suppliersRes.data : []}
            inventoryItems={itemsRes.ok ? itemsRes.data : []}
        />
    )
}
