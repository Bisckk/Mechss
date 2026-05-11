import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContabilidadClient from './ContabilidadClient'
import {
    getResumenFinancieroAction,
    getFlujoCajaAction,
    getMixIngresosAction,
    getCarteraPendienteAction,
    getTransaccionesAction,
} from '@/lib/actions/contabilidad'

export const metadata = { title: 'Contabilidad | MotoFix Admin' }

export default async function ContabilidadPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    // Solo admin puede acceder al módulo contable
    if ((perfil as any)?.role !== 'admin' && (perfil as any)?.role !== 'superadmin') {
        redirect('/admin/dashboard')
    }

    const [resumen, flujo, mix, cartera, transacciones] = await Promise.all([
        getResumenFinancieroAction(),
        getFlujoCajaAction(),
        getMixIngresosAction(),
        getCarteraPendienteAction(),
        getTransaccionesAction(),
    ])

    return (
        <ContabilidadClient
            resumen={resumen.ok ? resumen.data : { ingresos_mes: 0, egresos_mes: 0, utilidad_mes: 0, cartera_pendiente: 0 }}
            flujo={flujo.ok ? flujo.data : []}
            mix={mix.ok ? mix.data : []}
            cartera={cartera.ok ? cartera.data : []}
            transacciones={transacciones.ok ? transacciones.data : []}
        />
    )
}
