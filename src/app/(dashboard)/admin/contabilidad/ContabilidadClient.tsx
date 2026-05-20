'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import {
    LayoutDashboard, ArrowUpDown, Vault, Building2, Receipt, BarChart3,
    Download, FileDown, Upload, ChevronDown, X, AlertCircle,
} from 'lucide-react'
import { useStaggerFadeIn } from '@/hooks/useStaggerFadeIn'
import { exportTransacciones } from '@/lib/utils/exportar'
import { printBalanceMensual } from '@/lib/utils/reportes'
import { getTransaccionesAction, getCarteraPendienteAction, getResumenImpuestosAction } from '@/lib/actions/contabilidad'
import { getProveedoresAction, getFacturasProveedorAction } from '@/lib/actions/proveedores'
import TabResumen      from './tabs/TabResumen'
import TabMovimientos  from './tabs/TabMovimientos'
import TabCaja         from './tabs/TabCaja'
import TabProveedores  from './tabs/TabProveedores'
import TabImpuestos    from './tabs/TabImpuestos'
import TabReportes     from './tabs/TabReportes'
import type {
    ResumenFinanciero, FlujoCaja, MixIngreso, ItemCartera, Transaccion,
    SesionCaja, RolContabilidad,
} from '@/lib/types/contabilidad'
import type { Proveedor, FacturaProveedor, ResumenImpuestos } from '@/lib/types/contabilidad'

// ── Helpers ────────────────────────────────────────────────

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getMesActual(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMesLabel(yyyyMM: string): string {
    const [y, m] = yyyyMM.split('-')
    return `${MESES_ES[parseInt(m) - 1]} ${y}`
}

// ── Definición de tabs ─────────────────────────────────────

type TabId = 'resumen' | 'movimientos' | 'caja' | 'proveedores' | 'impuestos' | 'reportes'

interface TabDef {
    id:        TabId
    label:     string
    Icono:     React.ElementType
    soloAdmin: boolean
}

const TABS: TabDef[] = [
    { id: 'resumen',     label: 'Resumen',     Icono: LayoutDashboard, soloAdmin: true  },
    { id: 'movimientos', label: 'Movimientos',  Icono: ArrowUpDown,     soloAdmin: false },
    { id: 'caja',        label: 'Caja',         Icono: Vault,           soloAdmin: false },
    { id: 'proveedores', label: 'Proveedores',  Icono: Building2,       soloAdmin: true  },
    { id: 'impuestos',   label: 'Impuestos',    Icono: Receipt,         soloAdmin: true  },
    { id: 'reportes',    label: 'Reportes',     Icono: BarChart3,       soloAdmin: true  },
]

// ── Props ──────────────────────────────────────────────────

interface Props {
    rol:            RolContabilidad
    resumen:        ResumenFinanciero | null
    flujo:          FlujoCaja[]
    mix:            MixIngreso[]
    cartera:        ItemCartera[]
    transacciones:  Transaccion[]
    cajaActiva:     SesionCaja | null
    historialCaja:  SesionCaja[]
}

// ── Componente principal ───────────────────────────────────

export default function ContabilidadClient({
    rol, resumen, flujo, mix, cartera: carteraInit,
    transacciones, cajaActiva, historialCaja,
}: Props) {
    useStaggerFadeIn('.contab-item')

    const esAdmin   = rol === 'admin' || rol === 'superadmin'
    const tabInicio: TabId = esAdmin ? 'resumen' : 'caja'

    const [tabActivo, setTabActivo]         = useState<TabId>(tabInicio)
    const [cajaVigente, setCajaVigente]     = useState<SesionCaja | null>(cajaActiva)
    const [montado, setMontado]             = useState(false)

    useEffect(() => { setMontado(true) }, [])
    const [cartera, setCartera]             = useState<ItemCartera[]>(carteraInit)
    const [proveedores, setProveedores]     = useState<Proveedor[]>([])
    const [facturas, setFacturas]           = useState<FacturaProveedor[]>([])
    const [impuestos, setImpuestos]         = useState<ResumenImpuestos | null>(null)
    const [tabCargados, setTabCargados]     = useState<Set<TabId>>(new Set([tabInicio]))
    const [, startTransition]               = useTransition()

    const tabsVisibles = TABS.filter(t => esAdmin || !t.soloAdmin)

    // ── Exportar dropdown ──────────────────────────────────
    const [exportarAbierto, setExportarAbierto] = useState(false)
    const exportarRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!exportarAbierto) return
        const handler = (e: MouseEvent) => {
            if (!exportarRef.current?.contains(e.target as Node)) setExportarAbierto(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [exportarAbierto])

    // ── Importar ───────────────────────────────────────────
    const fileInputRef    = useRef<HTMLInputElement>(null)
    const [importFile, setImportFile]     = useState<File | null>(null)
    const importWrapRef   = useRef<HTMLDivElement>(null)
    const importBdRef     = useRef<HTMLDivElement>(null)
    const importModalRef  = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const wrapper  = importWrapRef.current
        const backdrop = importBdRef.current
        const modal    = importModalRef.current
        if (!wrapper || !backdrop || !modal) return
        if (importFile) {
            gsap.set(wrapper, { display: 'flex' })
            gsap.set(backdrop, { pointerEvents: 'auto' })
            gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'expo.out' })
            gsap.fromTo(modal, { opacity: 0, scale: 0.96, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'expo.out', force3D: true })
        } else {
            gsap.to(modal, { opacity: 0, scale: 0.96, y: 20, duration: 0.2, ease: 'expo.in' })
            gsap.to(backdrop, { opacity: 0, duration: 0.22, ease: 'expo.in',
                onComplete: () => {
                    gsap.set(wrapper, { display: 'none' })
                    gsap.set(backdrop, { pointerEvents: 'none' })
                }
            })
        }
    }, [importFile])

    const cerrarImportar = () => {
        setImportFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // ── GSAP tab indicator ─────────────────────────────────
    const indicadorRef  = useRef<HTMLDivElement>(null)
    const tabBtns       = useRef<Map<TabId, HTMLButtonElement>>(new Map())
    const primerRender  = useRef(true)

    useEffect(() => {
        const btn  = tabBtns.current.get(tabActivo)
        const pill = indicadorRef.current
        if (!btn || !pill) return

        if (primerRender.current) {
            primerRender.current = false
            gsap.set(pill, { x: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 })
        } else {
            gsap.to(pill, { x: btn.offsetLeft, width: btn.offsetWidth, duration: 0.35, ease: 'expo.out' })
        }
    }, [tabActivo])

    const seleccionarTab = (id: TabId) => {
        setTabActivo(id)
        if (tabCargados.has(id)) return
        setTabCargados(prev => new Set([...prev, id]))

        if (id === 'proveedores') {
            startTransition(async () => {
                const [p, f] = await Promise.all([getProveedoresAction(), getFacturasProveedorAction()])
                if (p.ok) setProveedores(p.data)
                if (f.ok) setFacturas(f.data)
            })
        }
        if (id === 'impuestos') {
            startTransition(async () => {
                const res = await getResumenImpuestosAction(getMesActual())
                if (res.ok) setImpuestos(res.data)
            })
        }
    }

    const refrescarCartera = () => {
        startTransition(async () => {
            const res = await getCarteraPendienteAction()
            if (res.ok) setCartera(res.data)
        })
    }

    const exportarCSVRapido = () => {
        startTransition(async () => {
            const res = await getTransaccionesAction({ tipo: 'todos', mes: getMesActual(), limite: 1000 })
            if (res.ok) exportTransacciones(res.data)
        })
    }

    const exportarPDFRapido = () => {
        if (!resumen) return
        startTransition(async () => {
            const mesActual = getMesActual()
            const res = await getTransaccionesAction({ tipo: 'todos', mes: mesActual, limite: 500 })
            printBalanceMensual(getMesLabel(mesActual), resumen, flujo, cartera, res.ok ? res.data : transacciones)
        })
    }

    return (
        <>
        <div className="space-y-8 pb-10">

            {/* ── Encabezado ────────────────────────────────── */}
            <div className="contab-item flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Contabilidad</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {esAdmin ? 'Gestión financiera completa del taller.' : 'Control de caja y movimientos del turno.'}
                    </p>
                </div>
                {esAdmin && (
                    <div className="flex items-center gap-2">
                        {/* Importar */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-xl transition-all border border-white/6"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Importar</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) setImportFile(f) }}
                        />

                        {/* Exportar dropdown */}
                        <div ref={exportarRef} className="relative">
                            <button
                                onClick={() => setExportarAbierto(p => !p)}
                                className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-xl transition-all border border-white/6"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Exportar</span>
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${exportarAbierto ? 'rotate-180' : ''}`} />
                            </button>
                            {exportarAbierto && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                                    <button
                                        onClick={() => { exportarCSVRapido(); setExportarAbierto(false) }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5 flex-shrink-0" />
                                        Excel / CSV
                                    </button>
                                    <button
                                        onClick={() => { exportarPDFRapido(); setExportarAbierto(false) }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-colors"
                                    >
                                        <FileDown className="w-3.5 h-3.5 flex-shrink-0" />
                                        Balance PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Navegación de tabs con GSAP ───────────────── */}
            <div className="contab-item">
                <div className="bg-zinc-900/60 border border-white/[0.06] rounded-2xl p-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="relative flex items-center gap-0.5">
                        {/* Indicador deslizante */}
                        <div
                            ref={indicadorRef}
                            className="absolute inset-y-0 bg-zinc-800 rounded-xl shadow-sm pointer-events-none"
                            style={{ opacity: 0, width: 0 }}
                        />
                        {tabsVisibles.map(tab => {
                            const { Icono } = tab
                            return (
                                <button
                                    key={tab.id}
                                    ref={el => { if (el) tabBtns.current.set(tab.id, el) }}
                                    onClick={() => seleccionarTab(tab.id)}
                                    className={`relative z-10 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                                        tabActivo === tab.id
                                            ? 'text-white'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    <Icono className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── Aviso caja sin abrir ─────────────────────── */}
            {!cajaVigente && tabActivo !== 'caja' && (
                <div className="contab-item flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-400">Caja sin abrir</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                            Los ingresos y egresos en efectivo no se asociarán a ningún turno activo.
                        </p>
                    </div>
                    <button
                        onClick={() => seleccionarTab('caja')}
                        className="flex-shrink-0 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors whitespace-nowrap"
                    >
                        Abrir caja →
                    </button>
                </div>
            )}

            {/* ── Contenido del tab activo ──────────────────── */}
            <div className="contab-item">
                {tabActivo === 'resumen' && esAdmin && resumen && (
                    <TabResumen
                        resumen={resumen}
                        flujo={flujo}
                        mix={mix}
                        cartera={cartera}
                        onRefrescarCartera={refrescarCartera}
                    />
                )}
                {tabActivo === 'movimientos' && (
                    <TabMovimientos transacciones={transacciones} rol={rol} />
                )}
                {tabActivo === 'caja' && (
                    <TabCaja
                        cajaActiva={cajaVigente}
                        historialCaja={historialCaja}
                        rol={rol}
                        onCajaChange={setCajaVigente}
                    />
                )}
                {tabActivo === 'proveedores' && esAdmin && (
                    <TabProveedores proveedores={proveedores} facturas={facturas} />
                )}
                {tabActivo === 'impuestos' && esAdmin && (
                    <TabImpuestos resumenInicial={impuestos} />
                )}
                {tabActivo === 'reportes' && esAdmin && (
                    <TabReportes resumen={resumen} flujo={flujo} cartera={cartera} />
                )}
            </div>
        </div>

        {/* ── Modal importar CSV (portal) ──────────────────── */}
        {montado && createPortal(
            <>
                <div
                    ref={importBdRef}
                    className="fixed inset-0 z-[155] bg-black/70 backdrop-blur-sm"
                    style={{ opacity: 0, pointerEvents: 'none' }}
                    onClick={cerrarImportar}
                />
                <div
                    ref={importWrapRef}
                    className="fixed inset-0 z-[156] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                    style={{ display: 'none' }}
                >
                    <div ref={importModalRef} className="pointer-events-auto relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold">Importar Contabilidad</h2>
                                    <p className="text-zinc-500 text-xs mt-0.5">{importFile?.name}</p>
                                </div>
                            </div>
                            <button onClick={cerrarImportar} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-5 py-6 space-y-4">
                            <div className="flex items-start gap-3 px-4 py-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-400">Importación en desarrollo</p>
                                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                                        La importación masiva de transacciones desde CSV/Excel estará disponible próximamente.
                                        El archivo debe tener columnas: fecha, concepto, tipo (ingreso/egreso), monto, categoría.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={cerrarImportar}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-zinc-400 hover:text-white font-medium rounded-xl transition-colors text-sm hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled
                                    className="flex-1 px-4 py-2.5 bg-orange-500/50 text-white/50 font-bold rounded-xl text-sm cursor-not-allowed"
                                >
                                    Importar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>,
            document.body
        )}
        </>
    )
}
