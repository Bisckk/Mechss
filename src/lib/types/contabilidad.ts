// ── Enums de dominio ───────────────────────────────────────

export enum CategoriaIngreso {
    Servicios  = 'Servicios',
    Repuestos  = 'Repuestos',
    Ecommerce  = 'Ecommerce',
    Otro       = 'Otro',
}

export enum CategoriaGasto {
    Nomina            = 'Nómina',
    Arriendo          = 'Arriendo',
    ServiciosPublicos = 'Servicios Públicos',
    CompraInventario  = 'Compra Inventario',
    Suscripcion       = 'Suscripción Plataforma',
    Impuestos         = 'Impuestos',
    Mantenimiento     = 'Mantenimiento',
    Marketing         = 'Marketing',
    Otro              = 'Otro',
}

export type TipoTransaccion   = 'income' | 'expense'
export type EstadoTransaccion = 'pending' | 'reconciled' | 'cancelled'
export type FuenteTransaccion = 'manual' | 'repair_auto' | 'inventory_auto'
export type FiltrotipoTransaccion = 'todos' | TipoTransaccion

// ── Interfaces de datos ────────────────────────────────────

export interface Transaccion {
    id: string
    tipo: TipoTransaccion
    categoria: string
    descripcion: string
    monto: number
    fecha: string
    estado: EstadoTransaccion
    fuente: FuenteTransaccion
    repair_id: string | null
    metodo_pago: string | null
    referencia: string | null
    created_at: string
}

export interface ResumenFinanciero {
    ingresos_mes: number
    egresos_mes: number
    utilidad_mes: number
    cartera_pendiente: number
}

export interface FlujoCaja {
    mes: string
    mes_label: string
    ingresos: number
    egresos: number
}

export interface MixIngreso {
    categoria: string
    total: number
    porcentaje: number
}

export interface ItemCartera {
    id: string
    tracking_code: string
    cliente: string
    vehiculo: string
    monto_pendiente: number
    fecha_completado: string | null
    dias_pendiente: number
}

export interface NuevaTransaccionParams {
    tipo: TipoTransaccion
    categoria: string
    descripcion: string
    monto: number
    fecha: string
    metodo_pago?: string
    referencia?: string
    notas?: string
}
