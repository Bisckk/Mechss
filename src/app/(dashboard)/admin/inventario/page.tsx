import { Metadata } from 'next'
import { getInventoryItemsAction } from '@/lib/actions/inventory'
import InventoryClient from './InventoryClient'

export const metadata: Metadata = {
    title: 'Inventario y Catálogo | MotoFix'
}

export default async function AdminInventoryPage() {
    const res = await getInventoryItemsAction()
    const items = res.ok ? res.data : []

    return <InventoryClient initialItems={items} />
}
