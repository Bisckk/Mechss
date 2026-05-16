'use client'

import { useState, useTransition, FormEvent } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
    TrendingUp, TrendingDown, DollarSign, Clock, Plus,
    ArrowUpCircle, ArrowDownCircle, X, CheckCircle2,
    AlertCircle, Loader2, ReceiptText, Wallet, FileDown, Download,
} from 'lucide-react'
import { exportTransacciones } from '@/lib/utils/exportar'
import MetricCard from '@/components/ui/MetricCard'
import CardV2 from '@/components/ui/CardV2'
import BadgeV2 from '@/components/ui/BadgeV2'
import EmptyState from '@/components/ui/EmptyState'
import { useStaggerFadeIn } from '@/hooks/useStaggerFadeIn'
import {
    type ResumenFinanciero,
    type FlujoCaja,
    type MixIngreso,
    type ItemCartera,
    type Transaccion,
    type NuevaTransaccionParams,
    type FiltrotipoTransaccion,
    getTransaccionesAction,
    crearTransaccionAction,
} from '@/lib/actions/contabilidad'
import { CategoriaIngreso, CategoriaGasto } from '@/lib/types/contabilidad'

// ── Helpers ────────────────────────────────────────────────

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getMesActual(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function generarOpcionesMeses() {
    const opciones: { valor: string; etiqueta: string }[] = []
    const hoy = new Date()
    for (let i = 0; i < 12; i++) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        opciones.push({ valor, etiqueta: `${MESES_ES[d.getMonth()]} ${d.getFullYear()}` })
    }
    return opciones
}

function formatCompacto(val: number): string {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}K`
    return `$${val.toFixed(0)}`
}

function formatCompleto(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

function formatFecha(iso: string): string {
    const d = new Date(iso + 'T00:00:00')
    return `${d.getDate()} ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`
}

const COLORES_PIE = ['#f97316', '#3b82f6', '#a855f7', '#71717a', '#22c55e', '#f59e0b']

// ── Componentes internos ───────────────────────────────────

function TooltipFlujo({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs min-w-[140px]">
            <p className="text-zinc-400 mb-2 font-medium">{label}</p>
            {payload.map((entry: any) => (
                <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-zinc-400">{entry.name}</span>
                    </div>
                    <span className="text-white font-semibold">{formatCompacto(entry.value)}</span>
                </div>
            ))}
        </div>
    )
}

function TooltipPastel({ active, payload }: any) {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
        <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
            <p className="text-zinc-300 font-medium">{item.name}</p>
            <p className="text-white font-bold mt-0.5">{formatCompleto(item.value)}</p>
            <p className="text-zinc-500">{item.payload.porcentaje}%</p>
        </div>
    )
}

function estadoBadge(estado: Transaccion['estado']) {
    if (estado === 'reconciled') return <BadgeV2 variante="exito"   etiqueta="Conciliado" />
    if (estado === 'cancelled')  return <BadgeV2 variante="peligro" etiqueta="Anulado" />
    return                              <BadgeV2 variante="alerta"  etiqueta="Pendiente" />
}

// ── Drawer nueva transacción ───────────────────────────────

interface DrawerProps {
    abierto: boolean
    cargando: boolean
    onCerrar: () => void
    onGuardar: (params: NuevaTransaccionParams) => void
}

function NuevaTransaccionDrawer({ abierto, cargando, onCerrar, onGuardar }: DrawerProps) {
    const [tipo, setTipo] = useState<'income' | 'expense'>('income')
    const [form, setForm] = useState({
        categoria: '', descripcion: '', monto: '', fecha: getMesActual().slice(0, 7) + '-01',
        metodo_pago: '', referencia: '', notas: '',
    })
    const [error, setError] = useState<string | null>(null)

    const categorias = tipo === 'income'
        ? Object.values(CategoriaIngreso)
        : Object.values(CategoriaGasto)

    const cambiar = (campo: string, valor: string) => {
        setForm(prev => ({ ...prev, [campo]: valor }))
        setError(null)
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        const monto = parseFloat(form.monto)
        if (!monto || monto <= 0) { setError('El monto debe ser mayor a cero.'); return }
        if (!form.categoria)       { setError('Selecciona una categoría.'); return }
        if (!form.descripcion.trim()) { setError('Ingresa una descripción.'); return }
        onGuardar({
            tipo,
            categoria:   form.categoria,
            descripcion: form.descripcion.trim(),
            monto,
            fecha:       form.fecha,
            metodo_pago: form.metodo_pago || undefined,
            referencia:  form.referencia  || undefined,
            notas:       form.notas       || undefined,
        })
    }

    return (
        <div className={`fixed inset-0 z-50 ${abierto ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                onClick={onCerrar}
            />
            <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/5 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${abierto ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 flex-shrink-0">
                    <h2 className="text-base font-semibold text-white">Nueva Transacción</h2>
                    <button onClick={onCerrar} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Tipo */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">Tipo</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['income', 'expense'] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => { setTipo(t); cambiar('categoria', '') }}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${tipo === t
                                        ? t === 'income'
                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                        : 'bg-zinc-800/50 text-zinc-500 border-transparent hover:border-white/10'
                                    }`}
                                >
                                    {t === 'income' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                                    {t === 'income' ? 'Ingreso' : 'Egreso'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoría</label>
                        <select
                            value={form.categoria}
                            onChange={e => cambiar('categoria', e.target.value)}
                            className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                        >
                            <option value="">Seleccionar...</option>
                            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Descripción</label>
                        <input
                            type="text"
                            value={form.descripcion}
                            onChange={e => cambiar('descripcion', e.target.value)}
                            placeholder="Ej: Pago nómina mecánicos mayo"
                            className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                        />
                    </div>

                    {/* Monto y Fecha */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Monto ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.monto}
                                onChange={e => cambiar('monto', e.target.value)}
                                placeholder="0"
                                className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fecha</label>
                            <input
                                type="date"
                                value={form.fecha}
                                onChange={e => cambiar('fecha', e.target.value)}
                                className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Método de pago */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Método de pago <span className="text-zinc-600">(opcional)</span></label>
                        <select
                            value={form.metodo_pago}
                            onChange={e => cambiar('metodo_pago', e.target.value)}
                            className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                        >
                            <option value="">Sin especificar</option>
                            {['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Cheque', 'Otro'].map(m =>
                                <option key={m} value={m}>{m}</option>
                            )}
                        </select>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notas <span className="text-zinc-600">(opcional)</span></label>
                        <textarea
                            value={form.notas}
                            onChange={e => cambiar('notas', e.target.value)}
                            rows={2}
                            className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 flex gap-3">
                    <button
                        type="button"
                        onClick={onCerrar}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-400 bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="form-transaccion"
                        disabled={cargando}
                        onClick={handleSubmit as any}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                    >
                        {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Props del componente principal ─────────────────────────

interface Props {
    resumen:      ResumenFinanciero
    flujo:        FlujoCaja[]
    mix:          MixIngreso[]
    cartera:      ItemCartera[]
    transacciones: Transaccion[]
}

// ── Componente principal ───────────────────────────────────

export default function ContabilidadClient({ resumen, flujo, mix, cartera, transacciones: txInit }: Props) {
    useStaggerFadeIn('.contab-item')

    const [transacciones, setTransacciones] = useState<Transaccion[]>(txInit)
    const [filtroTipo, setFiltroTipo]       = useState<FiltrotipoTransaccion>('todos')
    const [filtroMes, setFiltroMes]         = useState(getMesActual())
    const [mostrarDrawer, setMostrarDrawer] = useState(false)
    const [cargando, startTransition]       = useTransition()

    const opcionesMeses = generarOpcionesMeses()

    const aplicarFiltros = (tipo: FiltrotipoTransaccion, mes: string) => {
        setFiltroTipo(tipo)
        setFiltroMes(mes)
        startTransition(async () => {
            const res = await getTransaccionesAction({ tipo, mes })
            if (res.ok) setTransacciones(res.data)
        })
    }

    const guardarTransaccion = (params: NuevaTransaccionParams) => {
        startTransition(async () => {
            const res = await crearTransaccionAction(params)
            if (!res.ok) return
            const nuevas = await getTransaccionesAction({ tipo: filtroTipo, mes: filtroMes })
            if (nuevas.ok) setTransacciones(nuevas.data)
            setMostrarDrawer(false)
        })
    }

    const tendenciaUtilidad = resumen.utilidad_mes > 0 ? 'positivo'
        : resumen.utilidad_mes < 0 ? 'negativo' : 'neutro'

    const exportarPDF = () => {
        const mesLabel = opcionesMeses.find(o => o.valor === filtroMes)?.etiqueta ?? filtroMes
        const rows = transacciones.map(tx => `
            <tr>
                <td>${formatFecha(tx.fecha)}</td>
                <td style="color:${tx.tipo === 'income' ? '#22c55e' : '#f87171'}">${tx.tipo === 'income' ? 'Ingreso' : 'Egreso'}</td>
                <td>${tx.categoria}</td>
                <td>${tx.descripcion}</td>
                <td style="text-align:right;font-weight:700;color:${tx.tipo === 'income' ? '#22c55e' : '#f87171'}">${tx.tipo === 'income' ? '+' : '-'}${formatCompleto(tx.monto)}</td>
                <td>${tx.metodo_pago ?? '—'}</td>
            </tr>`).join('')

        const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Reporte Contabilidad — ${mesLabel}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;color:#18181b;background:#fff;padding:32px}
  h1{font-size:22px;font-weight:900;color:#09090b;margin-bottom:4px}
  .sub{font-size:13px;color:#71717a;margin-bottom:24px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
  .kpi{border:1px solid #e4e4e7;border-radius:12px;padding:16px}
  .kpi-label{font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
  .kpi-value{font-size:20px;font-weight:900;color:#09090b}
  .kpi-sub{font-size:11px;color:#71717a;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#f4f4f5;padding:10px 12px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#71717a;border-bottom:2px solid #e4e4e7}
  td{padding:9px 12px;border-bottom:1px solid #f4f4f5;color:#3f3f46;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  .footer{margin-top:24px;font-size:11px;color:#a1a1aa;text-align:right}
  @media print{body{padding:16px}}
</style></head><body>
  <h1>Reporte de Contabilidad</h1>
  <div class="sub">Período: <strong>${mesLabel}</strong> · Generado: ${new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' })}</div>
  <div class="kpis">
    <div class="kpi"><div class="kpi-label">Ingresos del mes</div><div class="kpi-value" style="color:#22c55e">${formatCompleto(resumen.ingresos_mes)}</div></div>
    <div class="kpi"><div class="kpi-label">Egresos del mes</div><div class="kpi-value" style="color:#f87171">${formatCompleto(resumen.egresos_mes)}</div></div>
    <div class="kpi"><div class="kpi-label">Utilidad neta</div><div class="kpi-value" style="color:${resumen.utilidad_mes >= 0 ? '#22c55e' : '#f87171'}">${formatCompleto(resumen.utilidad_mes)}</div></div>
    <div class="kpi"><div class="kpi-label">Cartera pendiente</div><div class="kpi-value" style="color:#f97316">${formatCompleto(resumen.cartera_pendiente)}</div></div>
  </div>
  <table>
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th style="text-align:right">Monto</th><th>Método</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#a1a1aa;padding:24px">Sin transacciones en este período</td></tr>'}</tbody>
  </table>
  <div class="footer">MotoFix Platform · Reporte generado automáticamente</div>
  <script>window.onload=()=>{window.print()}<\/script>
</body></html>`

        const w = window.open('', '_blank', 'width=900,height=700')
        if (w) { w.document.write(html); w.document.close() }
    }

    return (
        <div className="space-y-6 pb-10">

            {/* ── Encabezado ────────────────────────────────── */}
            <div className="contab-item flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Contabilidad</h1>
                    <p className="text-zinc-400 text-sm mt-1">Flujo de caja y gestión financiera del taller.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportTransacciones(transacciones)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold rounded-xl transition-colors border border-white/10"
                        title="Exportar CSV"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">CSV</span>
                    </button>
                    <button
                        onClick={exportarPDF}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-semibold rounded-xl transition-colors border border-white/10"
                    >
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => setMostrarDrawer(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nueva transacción</span>
                        <span className="sm:hidden">Nueva</span>
                    </button>
                </div>
            </div>

            {/* ── KPIs ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    className="contab-item"
                    etiqueta="Ingresos del Mes"
                    valor={formatCompacto(resumen.ingresos_mes)}
                    subtexto={formatCompleto(resumen.ingresos_mes)}
                    tendencia="positivo"
                    Icono={TrendingUp}
                    colorIcono="text-emerald-400"
                    bgIcono="bg-emerald-400/10"
                />
                <MetricCard
                    className="contab-item"
                    etiqueta="Egresos del Mes"
                    valor={formatCompacto(resumen.egresos_mes)}
                    subtexto={formatCompleto(resumen.egresos_mes)}
                    tendencia="negativo"
                    Icono={TrendingDown}
                    colorIcono="text-rose-400"
                    bgIcono="bg-rose-400/10"
                />
                <MetricCard
                    className="contab-item"
                    etiqueta="Utilidad del Mes"
                    valor={formatCompacto(resumen.utilidad_mes)}
                    subtexto={formatCompleto(resumen.utilidad_mes)}
                    tendencia={tendenciaUtilidad}
                    Icono={DollarSign}
                    colorIcono={tendenciaUtilidad === 'positivo' ? 'text-orange-400' : 'text-rose-400'}
                    bgIcono={tendenciaUtilidad === 'positivo' ? 'bg-orange-400/10' : 'bg-rose-400/10'}
                />
                <MetricCard
                    className="contab-item"
                    etiqueta="Cartera Pendiente"
                    valor={formatCompacto(resumen.cartera_pendiente)}
                    subtexto={formatCompleto(resumen.cartera_pendiente)}
                    tendencia={resumen.cartera_pendiente > 0 ? 'negativo' : 'positivo'}
                    etiquetaTendencia={resumen.cartera_pendiente > 0 ? 'Por cobrar' : 'Al día'}
                    Icono={Clock}
                    colorIcono="text-amber-400"
                    bgIcono="bg-amber-400/10"
                />
            </div>

            {/* ── Gráficos ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Flujo de Caja — Área */}
                <CardV2 relleno="lg" className="contab-item lg:col-span-2">
                    <h2 className="text-sm font-semibold text-white mb-5">Flujo de Caja — últimos 6 meses</h2>
                    {flujo.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={flujo} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.20} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis
                                    dataKey="mes_label"
                                    tick={{ fill: '#71717a', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#71717a', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={formatCompacto}
                                />
                                <Tooltip content={<TooltipFlujo />} />
                                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#22c55e" strokeWidth={2} fill="url(#gradIngresos)" dot={false} />
                                <Area type="monotone" dataKey="egresos"  name="Egresos"  stroke="#f43f5e" strokeWidth={2} fill="url(#gradEgresos)"  dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState Icono={TrendingUp} titulo="Sin datos de flujo de caja aún" descripcion="Las transacciones registradas aparecerán aquí." />
                    )}

                    {/* Leyenda manual */}
                    <div className="flex items-center gap-5 mt-4">
                        {[{ color: '#22c55e', label: 'Ingresos' }, { color: '#f43f5e', label: 'Egresos' }].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                                {label}
                            </div>
                        ))}
                    </div>
                </CardV2>

                {/* Mix de Ingresos — Pie */}
                <CardV2 relleno="lg" className="contab-item">
                    <h2 className="text-sm font-semibold text-white mb-5">Mix de Ingresos</h2>
                    {mix.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={mix}
                                        dataKey="total"
                                        nameKey="categoria"
                                        cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={80}
                                        paddingAngle={3}
                                    >
                                        {mix.map((_, i) => (
                                            <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<TooltipPastel />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className="mt-3 space-y-2">
                                {mix.map((item, i) => (
                                    <li key={item.categoria} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORES_PIE[i % COLORES_PIE.length] }} />
                                            <span className="text-zinc-400">{item.categoria}</span>
                                        </div>
                                        <span className="text-zinc-300 font-medium">{item.porcentaje}%</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <EmptyState Icono={DollarSign} titulo="Sin datos de ingresos" descripcion="Los ingresos del último trimestre aparecerán aquí." />
                    )}
                </CardV2>
            </div>

            {/* ── Cartera y Transacciones ───────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Cartera pendiente */}
                <CardV2 relleno="ninguno" className="contab-item overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                        <h2 className="text-sm font-semibold text-white">Cartera Pendiente</h2>
                        <BadgeV2 variante={cartera.length > 0 ? 'alerta' : 'exito'} etiqueta={cartera.length > 0 ? `${cartera.length} por cobrar` : 'Al día'} tamaño="sm" />
                    </div>

                    {cartera.length === 0 ? (
                        <EmptyState Icono={Wallet} titulo="Sin pagos pendientes" descripcion="¡Excelente! Todas las órdenes completadas han sido cobradas." />
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {cartera.map(item => (
                                <li key={item.id} className="px-5 py-4">
                                    {/* Mobile: stacked */}
                                    <div className="flex flex-col gap-1 sm:hidden">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono text-zinc-500">{item.tracking_code}</span>
                                            <span className="text-sm font-bold text-white">{formatCompacto(item.monto_pendiente)}</span>
                                        </div>
                                        <p className="text-sm text-zinc-300 font-medium">{item.cliente}</p>
                                        <p className="text-xs text-zinc-500">{item.vehiculo}</p>
                                        <BadgeV2
                                            variante={item.dias_pendiente > 7 ? 'peligro' : 'alerta'}
                                            etiqueta={item.dias_pendiente === 0 ? 'Hoy' : `${item.dias_pendiente}d pendiente`}
                                        />
                                    </div>
                                    {/* Desktop: row */}
                                    <div className="hidden sm:flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-200 truncate">{item.cliente}</p>
                                            <p className="text-xs text-zinc-500 truncate">{item.tracking_code} · {item.vehiculo}</p>
                                        </div>
                                        <BadgeV2
                                            variante={item.dias_pendiente > 7 ? 'peligro' : 'alerta'}
                                            etiqueta={item.dias_pendiente === 0 ? 'Hoy' : `${item.dias_pendiente}d`}
                                        />
                                        <span className="text-sm font-bold text-white min-w-[80px] text-right">{formatCompacto(item.monto_pendiente)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardV2>

                {/* Transacciones */}
                <CardV2 relleno="ninguno" className="contab-item overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/5">
                        <h2 className="text-sm font-semibold text-white">Transacciones</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Filtro tipo */}
                            <div className="flex rounded-lg overflow-hidden border border-white/8 text-xs">
                                {(['todos', 'income', 'expense'] as FiltrotipoTransaccion[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => aplicarFiltros(t, filtroMes)}
                                        className={`px-2.5 py-1.5 font-medium transition-colors ${filtroTipo === t ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        {t === 'todos' ? 'Todos' : t === 'income' ? 'Ingresos' : 'Egresos'}
                                    </button>
                                ))}
                            </div>
                            {/* Filtro mes */}
                            <select
                                value={filtroMes}
                                onChange={e => aplicarFiltros(filtroTipo, e.target.value)}
                                className="bg-zinc-800/60 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/40 transition-colors"
                            >
                                {opcionesMeses.map(op => (
                                    <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                        </div>
                    ) : transacciones.length === 0 ? (
                        <EmptyState Icono={ReceiptText} titulo="Sin transacciones este período" descripcion="Crea una nueva transacción con el botón superior." />
                    ) : (
                        <ul className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                            {transacciones.map(tx => (
                                <li key={tx.id} className="px-5 py-3.5">
                                    {/* Mobile: stacked */}
                                    <div className="flex flex-col gap-1 sm:hidden">
                                        <div className="flex items-center justify-between">
                                            <BadgeV2
                                                variante={tx.tipo === 'income' ? 'exito' : 'peligro'}
                                                etiqueta={tx.tipo === 'income' ? 'Ingreso' : 'Egreso'}
                                            />
                                            <span className={`text-sm font-bold ${tx.tipo === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tx.tipo === 'income' ? '+' : '-'}{formatCompacto(tx.monto)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-200 font-medium">{tx.descripcion}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-500">{tx.categoria}</span>
                                            <span className="text-xs text-zinc-600">{formatFecha(tx.fecha)}</span>
                                        </div>
                                    </div>
                                    {/* Desktop: row */}
                                    <div className="hidden sm:flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.tipo === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                            {tx.tipo === 'income'
                                                ? <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                                                : <ArrowDownCircle className="w-4 h-4 text-rose-400" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-zinc-200 font-medium truncate">{tx.descripcion}</p>
                                            <p className="text-xs text-zinc-500">{tx.categoria} · {formatFecha(tx.fecha)}</p>
                                        </div>
                                        {estadoBadge(tx.estado)}
                                        <span className={`text-sm font-bold min-w-[80px] text-right flex-shrink-0 ${tx.tipo === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {tx.tipo === 'income' ? '+' : '-'}{formatCompacto(tx.monto)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardV2>
            </div>

            {/* ── Drawer ────────────────────────────────────── */}
            <NuevaTransaccionDrawer
                abierto={mostrarDrawer}
                cargando={cargando}
                onCerrar={() => setMostrarDrawer(false)}
                onGuardar={guardarTransaccion}
            />
        </div>
    )
}
