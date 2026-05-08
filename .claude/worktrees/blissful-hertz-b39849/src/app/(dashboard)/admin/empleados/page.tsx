import type { Metadata } from 'next'
import EmpleadosClient from '@/components/admin/empleados/EmpleadosClient'

export const metadata: Metadata = {
    title: 'Empleados | Admin',
}

export default function AdminEmpleadosPage() {
    return <EmpleadosClient />
}
