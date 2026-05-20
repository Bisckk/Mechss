// ── Enums de dominio ───────────────────────────────────────

export enum CategoriaIngreso {
    Servicios      = 'Servicios',
    Repuestos      = 'Repuestos',
    Ecommerce      = 'Ecommerce',
    AbonoCartera   = 'Abono Cartera',
    Otro           = 'Otro',
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
    PagoProveedor     = 'Pago Proveedor',
    Otro              = 'Otro',
}

export enum MetodoPago {
    Efectivo         = 'Efectivo',
    Transferencia    = 'Transferencia bancaria',
    TarjetaDebito    = 'Tarjeta débito',
    TarjetaCredito   = 'Tarjeta crédito',
    BilleteraDigital = 'Billetera digital',
    Cheque           = 'Cheque',
    Vale             = 'Vale',
    Otro             = 'Otro',
}

export enum TipoImpuesto {
    Ninguno     = 'Ninguno',
    IVA         = 'IVA',
    ICA         = 'ICA',
    RetFuente   = 'Retención en la Fuente',
    Impoconsumo = 'Impoconsumo',
}

export const TASA_IMPUESTO: Record<TipoImpuesto, number> = {
    [TipoImpuesto.Ninguno]:     0,
    [TipoImpuesto.IVA]:         0.19,
    [TipoImpuesto.ICA]:         0.01,
    [TipoImpuesto.RetFuente]:   0.035,
    [TipoImpuesto.Impoconsumo]: 0.08,
}

export type TipoTransaccion   = 'income' | 'expense'
export type EstadoTransaccion = 'pending' | 'reconciled' | 'cancelled'
export type FuenteTransaccion = 'manual' | 'repair_auto' | 'inventory_auto' | 'caja'
export type FiltrotipoTransaccion = 'todos' | TipoTransaccion
export type RolContabilidad = 'admin' | 'superadmin' | 'receptionist'
export type EstadoCaja = 'open' | 'closed'
export type EstadoFacturaProveedor = 'pending' | 'partial' | 'paid'

// ── Transacciones ──────────────────────────────────────────

export interface Transaccion {
    id: string
    tipo: TipoTransaccion
    categoria: string
    descripcion: string
    monto: number
    impuesto_tipo: string | null
    impuesto_valor: number
    fecha: string
    estado: EstadoTransaccion
    fuente: FuenteTransaccion
    repair_id: string | null
    metodo_pago: string | null
    referencia: string | null
    notas: string | null
    created_at: string
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
    impuesto_tipo?: TipoImpuesto
    repair_id?: string
}

// ── Resúmenes ──────────────────────────────────────────────

export interface ResumenFinanciero {
    ingresos_mes: number
    egresos_mes: number
    utilidad_mes: number
    cartera_pendiente: number
    iva_por_pagar: number
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

// ── Cartera ────────────────────────────────────────────────

export interface ItemCartera {
    id: string
    tracking_code: string
    cliente: string
    vehiculo: string
    monto_total: number
    monto_pagado: number
    monto_pendiente: number
    fecha_completado: string | null
    dias_pendiente: number
}

export interface AbonoCarteraParams {
    repair_id: string
    monto: number
    metodo_pago: string
    fecha: string
    notas?: string
}

// ── Caja ───────────────────────────────────────────────────

export interface SesionCaja {
    id: string
    usuario_id: string
    usuario_nombre: string
    saldo_inicial: number
    saldo_final: number | null
    total_ingresos_efectivo: number
    total_egresos_efectivo: number
    diferencia: number | null
    estado: EstadoCaja
    apertura_at: string
    cierre_at: string | null
    notas_cierre: string | null
}

export interface AperturaCajaParams {
    saldo_inicial: number
    notas?: string
}

export interface CierreCajaParams {
    sesion_id: string
    saldo_final: number
    notas?: string
}

export interface ArqueoCaja {
    sesion: SesionCaja
    diferencia: number
    transacciones_efectivo: number
    transacciones_otros: number
    total_efectivo_sistema: number
    total_efectivo_real: number
    estado: 'cuadrado' | 'sobrante' | 'faltante'
}

// ── Proveedores ────────────────────────────────────────────

export interface Proveedor {
    id: string
    nombre: string
    nit: string | null
    contacto: string | null
    telefono: string | null
    email: string | null
    saldo_pendiente: number
}

export interface NuevoProveedorParams {
    nombre: string
    nit?: string
    contacto?: string
    telefono?: string
    email?: string
}

export interface FacturaProveedor {
    id: string
    proveedor_id: string
    proveedor_nombre: string
    numero_factura: string
    concepto: string
    monto_total: number
    monto_pagado: number
    saldo_pendiente: number
    fecha_emision: string
    fecha_vencimiento: string | null
    estado: EstadoFacturaProveedor
}

export interface NuevaFacturaProveedorParams {
    proveedor_id: string
    numero_factura: string
    concepto: string
    monto_total: number
    fecha_emision: string
    fecha_vencimiento?: string
}

export interface PagoProveedorParams {
    factura_id: string
    monto: number
    metodo_pago: string
    fecha: string
    notas?: string
}

// ── Impuestos ──────────────────────────────────────────────

export interface ResumenImpuestos {
    periodo: string
    iva_generado: number
    iva_descontable: number
    iva_neto: number
    ica: number
    ret_fuente: number
    impoconsumo: number
    total_a_pagar: number
}

// ── Estado de Resultados P&G ───────────────────────────────

export interface LineaEstadoResultados {
    concepto: string
    monto: number
    porcentaje: number
}

export interface EstadoResultados {
    periodo: string
    ventas_brutas: number
    costo_ventas: number
    utilidad_bruta: number
    gastos_operacionales: LineaEstadoResultados[]
    total_gastos: number
    utilidad_operacional: number
    impuestos_estimados: number
    utilidad_neta: number
    margen_neto: number
}
