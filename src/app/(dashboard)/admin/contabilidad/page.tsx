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
import { getCajaActivaAction, getHistorialCajaAction } from '@/lib/actions/caja'
import type { RolContabilidad } from '@/lib/types/contabilidad'

export const metadata = { title: 'Contabilidad | MotoFix Admin' }

const ROLES_PERMITIDOS: string[] = ['admin', 'superadmin', 'receptionist']

export default async function ContabilidadPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const rol = (perfil as any)?.role as string | undefined
    if (!rol || !ROLES_PERMITIDOS.includes(rol)) redirect('/admin/dashboard')

    const rolContabilidad = rol as RolContabilidad
    const esAdmin = rolContabilidad === 'admin' || rolContabilidad === 'superadmin'

    // Caja: siempre se carga (admin y receptionist)
    const [cajaActiva, historialCaja] = await Promise.all([
        getCajaActivaAction(),
        getHistorialCajaAction(10),
    ])

    if (!esAdmin) {
        // Vista recepcionista: solo datos de caja + transacciones del día
        const [transacciones] = await Promise.all([
            getTransaccionesAction(),
        ])

        return (
            <ContabilidadClient
                rol={rolContabilidad}
                resumen={null}
                flujo={[]}
                mix={[]}
                cartera={[]}
                transacciones={transacciones.ok ? transacciones.data : []}
                cajaActiva={cajaActiva.ok ? cajaActiva.data : null}
                historialCaja={historialCaja.ok ? historialCaja.data : []}
            />
        )
    }

    // Vista admin/superadmin: todos los datos
    const [resumen, flujo, mix, cartera, transacciones] = await Promise.all([
        getResumenFinancieroAction(),
        getFlujoCajaAction(),
        getMixIngresosAction(),
        getCarteraPendienteAction(),
        getTransaccionesAction(),
    ])

    return (
        <ContabilidadClient
            rol={rolContabilidad}
            resumen={resumen.ok ? resumen.data : null}
            flujo={flujo.ok ? flujo.data : []}
            mix={mix.ok ? mix.data : []}
            cartera={cartera.ok ? cartera.data : []}
            transacciones={transacciones.ok ? transacciones.data : []}
            cajaActiva={cajaActiva.ok ? cajaActiva.data : null}
            historialCaja={historialCaja.ok ? historialCaja.data : []}
        />
    )
}
