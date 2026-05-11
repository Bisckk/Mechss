import { getInventoryMovementsAction } from '@/lib/actions/inventario_v2'
import KardexClient from './KardexClient'

export default async function KardexPage() {
    const res = await getInventoryMovementsAction({ limit: 200 })
    return <KardexClient initialMovements={res.ok ? res.data : []} />
}
