import { getSuppliersAction } from '@/lib/actions/inventario_v2'
import ProveedoresClient from './ProveedoresClient'

export default async function ProveedoresPage() {
    const res = await getSuppliersAction()
    return <ProveedoresClient initialSuppliers={res.ok ? res.data : []} />
}
