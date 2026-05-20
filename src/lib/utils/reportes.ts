// Print-to-PDF report utilities — open a styled popup window and call window.print()

const STYLES = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18181b;background:#fff;padding:32px 36px}
h1{font-size:20px;font-weight:900;color:#09090b;margin-bottom:2px}
h2{font-size:13px;font-weight:700;color:#09090b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #f97316}
.meta{font-size:12px;color:#71717a;margin-bottom:24px}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px}
.kpi{border:1px solid #e4e4e7;border-radius:10px;padding:14px}
.kpi-label{font-size:10px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;font-weight:600}
.kpi-value{font-size:18px;font-weight:900;color:#09090b}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.info-item label{font-size:10px;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em;display:block;font-weight:600;margin-bottom:2px}
.info-item span{font-size:13px;color:#18181b;font-weight:500}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px}
th{background:#f4f4f5;padding:9px 12px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#71717a;border-bottom:2px solid #e4e4e7}
td{padding:8px 12px;border-bottom:1px solid #f4f4f5;color:#3f3f46;vertical-align:top}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.badge-green{background:#dcfce7;color:#16a34a}
.badge-amber{background:#fef9c3;color:#ca8a04}
.badge-red{background:#fee2e2;color:#dc2626}
.badge-gray{background:#f4f4f5;color:#71717a}
.section{margin-bottom:28px}
.vehicle-card{border:1px solid #e4e4e7;border-radius:10px;padding:12px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.vehicle-card-title{font-size:13px;font-weight:700;color:#18181b}
.vehicle-card-sub{font-size:11px;color:#71717a;margin-top:2px}
.plate{background:#09090b;color:#fff;padding:2px 8px;border-radius:5px;font-size:11px;font-weight:700;font-family:monospace;letter-spacing:.08em}
.repair-card{border:1px solid #e4e4e7;border-radius:10px;padding:14px 16px;margin-bottom:10px}
.repair-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.tracking{font-family:monospace;font-size:12px;font-weight:700;color:#f97316}
.repair-date{font-size:11px;color:#a1a1aa}
.repair-issue{font-size:13px;color:#3f3f46;margin-bottom:6px}
.repair-meta{display:flex;gap:16px;font-size:11px;color:#71717a}
.footer{margin-top:20px;padding-top:12px;border-top:1px solid #e4e4e7;font-size:10px;color:#a1a1aa;display:flex;justify-content:space-between}
.badge-blue{background:#dbeafe;color:#1d4ed8}
.kpis-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.kpi-green .kpi-value{color:#16a34a}
.kpi-red .kpi-value{color:#dc2626}
.kpi-amber .kpi-value{color:#d97706}
.kpi-meta{font-size:10px;color:#a1a1aa;margin-top:3px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
.header-bar{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #f97316;padding-bottom:16px;margin-bottom:28px}
.header-meta{text-align:right;font-size:11px;color:#a1a1aa;line-height:1.6}
.right{text-align:right}
.tr-total td{font-weight:800;background:#f9f9f9;border-top:2px solid #e4e4e7!important;border-bottom:none!important}
.tr-cancelled td{color:#a1a1aa;text-decoration:line-through}
.trend-up{color:#16a34a;font-weight:700}
.trend-down{color:#dc2626;font-weight:700}
.alert-row{background:#fffbeb}
.critical-row{background:#fff1f2}
.empty-msg{color:#a1a1aa;font-size:12px;text-align:center;padding:16px 0;font-style:italic}
@media print{body{padding:16px 20px} @page{margin:1cm}}
`

function openPrintWindow(title: string, body: string): void {
    const win = window.open('', '_blank', 'width=900,height=720')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${title}</title><style>${STYLES}</style></head>
<body>${body}<script>window.onload=()=>{window.print()}<\/script></body>
</html>`)
    win.document.close()
    win.focus()
}

function cop(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_LABELS: Record<string, string> = {
    received: 'Recibido', in_progress: 'En diagnóstico', repairing: 'En reparación',
    waiting_parts: 'Esp. repuestos', completed: 'Completado', delivered: 'Entregado',
    cancelled: 'Cancelado', ready: 'Listo', quality_check: 'Revisión calidad', diagnosing: 'Diagnosticando',
}

// ── Vehicle History Report ──────────────────────────────────

interface RepairLog {
    tracking_code: string
    status: string
    reported_issue: string
    created_at: string
    estimated_cost: number | null
    final_cost: number | null
    mechanic: { full_name: string } | null
}

interface VehicleInfo {
    brand: string
    model: string
    year: number | null
    plate: string
}

export function printVehicleHistoryReport(
    vehicle: VehicleInfo,
    repairs: RepairLog[],
    clientName: string
): void {
    const vehicleTitle = `${vehicle.brand} ${vehicle.model}${vehicle.year ? ` ${vehicle.year}` : ''}`
    const completedCount = repairs.filter(r => r.status === 'completed' || r.status === 'delivered').length
    const totalSpent = repairs.reduce((acc, r) => acc + (r.final_cost ?? r.estimated_cost ?? 0), 0)

    const repairCards = repairs.length
        ? repairs.map(r => {
            const statusLabel = STATUS_LABELS[r.status] ?? r.status
            const badgeClass = r.status === 'delivered' || r.status === 'completed'
                ? 'badge-green'
                : r.status === 'cancelled'
                ? 'badge-red'
                : r.status === 'waiting_parts'
                ? 'badge-amber'
                : 'badge-gray'
            const cost = r.final_cost ?? r.estimated_cost
            return `<div class="repair-card">
  <div class="repair-header">
    <span class="tracking">#${r.tracking_code}</span>
    <span class="repair-date">${fmtDate(r.created_at)}</span>
  </div>
  <div><span class="badge ${badgeClass}">${statusLabel}</span></div>
  <p class="repair-issue" style="margin-top:8px">${r.reported_issue ?? '—'}</p>
  <div class="repair-meta">
    ${r.mechanic ? `<span>Mecánico: ${r.mechanic.full_name}</span>` : ''}
    ${cost ? `<span>Costo: ${cop(cost)}</span>` : ''}
  </div>
</div>`
        }).join('')
        : `<p style="color:#a1a1aa;font-size:13px;padding:16px 0">Sin servicios registrados para este vehículo.</p>`

    const body = `
<h1>Historial Clínico Vehicular</h1>
<div class="meta">
  <span class="plate">${vehicle.plate}</span>&nbsp;&nbsp;
  ${vehicleTitle} · Cliente: <strong>${clientName}</strong>
</div>

<div class="kpis">
  <div class="kpi"><div class="kpi-label">Total servicios</div><div class="kpi-value">${repairs.length}</div></div>
  <div class="kpi"><div class="kpi-label">Completados</div><div class="kpi-value" style="color:#16a34a">${completedCount}</div></div>
  <div class="kpi"><div class="kpi-label">Total invertido</div><div class="kpi-value" style="color:#f97316">${cop(totalSpent)}</div></div>
</div>

<div class="section">
  <h2>Servicios (${repairs.length})</h2>
  ${repairCards}
</div>

<div class="footer">
  <span>MotoFix Platform</span>
  <span>Generado el ${fmtDate(new Date().toISOString())}</span>
</div>`

    openPrintWindow(`Historial — ${vehicleTitle} ${vehicle.plate}`, body)
}

// ── Client Profile Report ──────────────────────────────────

interface ClientInfo {
    full_name: string
    phone: string | null
    email: string | null
    created_at: string
}

interface VehicleBasic {
    plate: string
    brand: string
    model: string
    year: number | null
}

export function printClientProfileReport(
    client: ClientInfo,
    vehicles: VehicleBasic[]
): void {
    const vehicleRows = vehicles.length
        ? vehicles.map((v, i) => `<tr>
  <td>${i + 1}</td>
  <td><span class="plate">${v.plate}</span></td>
  <td>${v.brand} ${v.model}${v.year ? ` ${v.year}` : ''}</td>
</tr>`).join('')
        : `<tr><td colspan="3" style="color:#a1a1aa;text-align:center;padding:16px">Sin vehículos registrados</td></tr>`

    const body = `
<h1>Ficha de Cliente</h1>
<div class="meta">Generado el ${fmtDate(new Date().toISOString())}</div>

<div class="section">
  <h2>Datos de Contacto</h2>
  <div class="info-grid">
    <div class="info-item"><label>Nombre completo</label><span>${client.full_name}</span></div>
    <div class="info-item"><label>Teléfono</label><span>${client.phone ?? '—'}</span></div>
    <div class="info-item"><label>Correo electrónico</label><span>${client.email ?? '—'}</span></div>
    <div class="info-item"><label>Fecha de registro</label><span>${fmtDate(client.created_at)}</span></div>
  </div>
</div>

<div class="section">
  <h2>Vehículos (${vehicles.length})</h2>
  <table>
    <thead><tr><th>#</th><th>Placa</th><th>Vehículo</th></tr></thead>
    <tbody>${vehicleRows}</tbody>
  </table>
</div>

<div class="footer">
  <span>MotoFix Platform</span>
  <span>Generado el ${fmtDate(new Date().toISOString())}</span>
</div>`

    openPrintWindow(`Ficha — ${client.full_name}`, body)
}

// ── Balance Mensual ─────────────────────────────────────────

interface BalResumen {
    ingresos_mes: number
    egresos_mes: number
    utilidad_mes: number
    cartera_pendiente: number
}

interface BalFlujoCaja {
    mes_label: string
    ingresos: number
    egresos: number
}

interface BalCartera {
    tracking_code: string
    cliente: string
    vehiculo: string
    monto_pendiente: number
    dias_pendiente: number
    fecha_completado: string | null
}

interface BalTransaccion {
    tipo: string
    categoria: string
    descripcion: string
    monto: number
    fecha: string
    estado: string
    metodo_pago: string | null
    referencia: string | null
}

export function printBalanceMensual(
    mesLabel: string,
    resumen: BalResumen,
    flujo: BalFlujoCaja[],
    cartera: BalCartera[],
    transacciones: BalTransaccion[]
): void {
    const activas    = transacciones.filter(t => t.estado !== 'cancelled')
    const ingresos   = activas.filter(t => t.tipo === 'income')
    const egresos    = activas.filter(t => t.tipo === 'expense')
    const canceladas = transacciones.filter(t => t.estado === 'cancelled')

    const totalIng = ingresos.reduce((s, t) => s + t.monto, 0)
    const totalEgr = egresos.reduce((s, t) => s + t.monto, 0)
    const margen   = totalIng > 0 ? Math.round(((totalIng - totalEgr) / totalIng) * 100) : 0

    // Agrupación por categoría
    const buildCat = (txs: BalTransaccion[], total: number) => {
        const m = new Map<string, number>()
        txs.forEach(t => m.set(t.categoria, (m.get(t.categoria) ?? 0) + t.monto))
        return Array.from(m.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([cat, v]) => ({ cat, v, pct: total > 0 ? Math.round((v / total) * 100) : 0 }))
    }
    const ingCat = buildCat(ingresos, totalIng)
    const egrCat = buildCat(egresos, totalEgr)

    // Métodos de pago
    const metMap = new Map<string, { n: number; ing: number; egr: number }>()
    activas.forEach(t => {
        const k = t.metodo_pago ?? 'Sin especificar'
        const p = metMap.get(k) ?? { n: 0, ing: 0, egr: 0 }
        metMap.set(k, { n: p.n + 1, ing: p.ing + (t.tipo === 'income' ? t.monto : 0), egr: p.egr + (t.tipo === 'expense' ? t.monto : 0) })
    })
    const metodos = Array.from(metMap.entries()).sort((a, b) => (b[1].ing + b[1].egr) - (a[1].ing + a[1].egr))

    // ── Helpers ──
    const tc = (v: number) => v >= 0 ? 'trend-up' : 'trend-down'
    const sign = (v: number) => v >= 0 ? '+' : ''

    const estadoBadge = (e: string) =>
        e === 'reconciled' ? '<span class="badge badge-green">Conciliado</span>'
        : e === 'cancelled' ? '<span class="badge badge-red">Anulado</span>'
        : '<span class="badge badge-amber">Pendiente</span>'

    // ── Flujo histórico ──
    const flujoAcum = flujo.reduce((a, f) => ({ i: a.i + f.ingresos, e: a.e + f.egresos }), { i: 0, e: 0 })
    const flujoUtil = flujoAcum.i - flujoAcum.e
    const flujoMg   = flujoAcum.i > 0 ? Math.round((flujoUtil / flujoAcum.i) * 100) : 0

    const flujoRows = flujo.length > 0
        ? flujo.map(f => {
            const u = f.ingresos - f.egresos
            const mg = f.ingresos > 0 ? Math.round((u / f.ingresos) * 100) : 0
            return `<tr>
                <td><strong>${f.mes_label}</strong></td>
                <td class="right" style="color:#16a34a">${cop(f.ingresos)}</td>
                <td class="right" style="color:#dc2626">${cop(f.egresos)}</td>
                <td class="right ${tc(u)}">${sign(u)}${cop(u)}</td>
                <td class="right ${tc(u)}">${mg}%</td>
            </tr>`
        }).join('') + (flujo.length > 1 ? `<tr class="tr-total">
                <td>Acumulado 6 meses</td>
                <td class="right" style="color:#16a34a">${cop(flujoAcum.i)}</td>
                <td class="right" style="color:#dc2626">${cop(flujoAcum.e)}</td>
                <td class="right ${tc(flujoUtil)}">${sign(flujoUtil)}${cop(flujoUtil)}</td>
                <td class="right ${tc(flujoUtil)}">${flujoMg}%</td>
            </tr>` : '')
        : `<tr><td colspan="5" class="empty-msg">Sin datos históricos.</td></tr>`

    // ── Categorías ──
    const catRows = (rows: { cat: string; v: number; pct: number }[], colorStyle: string, total: number, label: string) =>
        rows.length > 0
            ? rows.map(r => `<tr>
                <td>${r.cat}</td>
                <td class="right" style="${colorStyle};font-weight:700">${cop(r.v)}</td>
                <td class="right">${r.pct}%</td>
            </tr>`).join('') + `<tr class="tr-total">
                <td>${label}</td>
                <td class="right" style="${colorStyle}">${cop(total)}</td>
                <td class="right">100%</td>
            </tr>`
            : `<tr><td colspan="3" class="empty-msg">Sin registros.</td></tr>`

    // ── Transacciones ──
    const TX_TH = `<tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Método</th><th>Referencia</th><th>Estado</th><th class="right">Monto</th></tr>`

    const txRow = (t: BalTransaccion) => `<tr>
        <td>${fmtDate(t.fecha)}</td>
        <td>${t.descripcion}</td>
        <td>${t.categoria}</td>
        <td>${t.metodo_pago ?? '—'}</td>
        <td style="font-family:monospace;font-size:11px;color:#a1a1aa">${t.referencia ?? '—'}</td>
        <td>${estadoBadge(t.estado)}</td>
        <td class="right" style="font-weight:700;color:${t.tipo === 'income' ? '#16a34a' : '#dc2626'}">${t.tipo === 'income' ? '+' : '-'}${cop(t.monto)}</td>
    </tr>`

    const ingRows = [...ingresos].sort((a, b) => a.fecha.localeCompare(b.fecha))
    const egrRows = [...egresos].sort((a, b) => a.fecha.localeCompare(b.fecha))

    const txTable = (rows: BalTransaccion[], total: number, colorStyle: string, totalLabel: string, emptyMsg: string) =>
        rows.length > 0
            ? rows.map(txRow).join('') + `<tr class="tr-total">
                <td colspan="6">${totalLabel}</td>
                <td class="right" style="${colorStyle}">${sign(total > 0 ? 1 : -1)}${cop(total)}</td>
            </tr>`
            : `<tr><td colspan="7" class="empty-msg">${emptyMsg}</td></tr>`

    // ── Cartera ──
    const carteraSorted = [...cartera].sort((a, b) => b.dias_pendiente - a.dias_pendiente)
    const totalCartera  = cartera.reduce((s, i) => s + i.monto_pendiente, 0)

    const carteraRows = carteraSorted.map(item => {
        const cls = item.dias_pendiente > 7 ? 'critical-row' : item.dias_pendiente > 3 ? 'alert-row' : ''
        const urg = item.dias_pendiente > 7
            ? '<span class="badge badge-red">Crítico</span>'
            : item.dias_pendiente > 3
            ? '<span class="badge badge-amber">Alerta</span>'
            : '<span class="badge badge-gray">Normal</span>'
        return `<tr class="${cls}">
            <td><span style="font-family:monospace;font-size:11px;color:#f97316;font-weight:700">${item.tracking_code}</span></td>
            <td>${item.cliente}</td>
            <td>${item.vehiculo}</td>
            <td>${item.fecha_completado ? fmtDate(item.fecha_completado) : '—'}</td>
            <td class="right">${item.dias_pendiente === 0 ? 'Hoy' : `${item.dias_pendiente} días`}</td>
            <td>${urg}</td>
            <td class="right" style="font-weight:700;color:#d97706">${cop(item.monto_pendiente)}</td>
        </tr>`
    }).join('')

    // ── Métodos de pago ──
    const metRows = metodos.length > 0
        ? metodos.map(([met, d]) => {
            const neto = d.ing - d.egr
            return `<tr>
                <td>${met}</td>
                <td class="right">${d.n}</td>
                <td class="right" style="color:#16a34a">${d.ing > 0 ? cop(d.ing) : '—'}</td>
                <td class="right" style="color:#dc2626">${d.egr > 0 ? cop(d.egr) : '—'}</td>
                <td class="right ${tc(neto)}">${sign(neto)}${cop(neto)}</td>
            </tr>`
        }).join('')
        : `<tr><td colspan="5" class="empty-msg">Sin transacciones en este período.</td></tr>`

    // ── Ensamblado HTML ──
    const body = `
<div class="header-bar">
    <div>
        <h1>Balance Mensual</h1>
        <p class="meta" style="margin-bottom:0">Período: <strong>${mesLabel}</strong>
            &nbsp;·&nbsp; ${activas.length} transacciones activas
            &nbsp;·&nbsp; ${ingresos.length} ingresos · ${egresos.length} egresos
            ${canceladas.length > 0 ? `&nbsp;·&nbsp; ${canceladas.length} anuladas` : ''}
        </p>
    </div>
    <div class="header-meta">
        <div>Generado el ${fmtDate(new Date().toISOString())}</div>
        <div style="color:#f97316;font-weight:700">MotoFix Platform</div>
    </div>
</div>

<div class="kpis-4">
    <div class="kpi kpi-green">
        <div class="kpi-label">Ingresos del mes</div>
        <div class="kpi-value">${cop(resumen.ingresos_mes)}</div>
        <div class="kpi-meta">${ingresos.length} transacciones activas</div>
    </div>
    <div class="kpi kpi-red">
        <div class="kpi-label">Egresos del mes</div>
        <div class="kpi-value">${cop(resumen.egresos_mes)}</div>
        <div class="kpi-meta">${egresos.length} transacciones activas</div>
    </div>
    <div class="kpi ${resumen.utilidad_mes >= 0 ? 'kpi-green' : 'kpi-red'}">
        <div class="kpi-label">Utilidad neta</div>
        <div class="kpi-value">${cop(resumen.utilidad_mes)}</div>
        <div class="kpi-meta">Margen: ${margen}% ${resumen.utilidad_mes >= 0 ? '▲' : '▼'}</div>
    </div>
    <div class="kpi kpi-amber">
        <div class="kpi-label">Cartera pendiente</div>
        <div class="kpi-value">${cop(resumen.cartera_pendiente)}</div>
        <div class="kpi-meta">${cartera.length} orden${cartera.length !== 1 ? 'es' : ''} por cobrar</div>
    </div>
</div>

<div class="section">
    <h2>Flujo de Caja — Últimos 6 Meses</h2>
    <table>
        <thead><tr>
            <th>Mes</th><th class="right">Ingresos</th><th class="right">Egresos</th>
            <th class="right">Utilidad</th><th class="right">Margen</th>
        </tr></thead>
        <tbody>${flujoRows}</tbody>
    </table>
</div>

<div class="two-col">
    <div>
        <h2>Ingresos por Categoría</h2>
        <table>
            <thead><tr><th>Categoría</th><th class="right">Monto</th><th class="right">%</th></tr></thead>
            <tbody>${catRows(ingCat, 'color:#16a34a', totalIng, 'Total ingresos')}</tbody>
        </table>
    </div>
    <div>
        <h2>Egresos por Categoría</h2>
        <table>
            <thead><tr><th>Categoría</th><th class="right">Monto</th><th class="right">%</th></tr></thead>
            <tbody>${catRows(egrCat, 'color:#dc2626', totalEgr, 'Total egresos')}</tbody>
        </table>
    </div>
</div>

<div class="section">
    <h2>Detalle de Ingresos del Período (${ingresos.length})</h2>
    <table>
        <thead>${TX_TH}</thead>
        <tbody>${txTable(ingRows, totalIng, 'color:#16a34a', 'Total ingresos activos', 'Sin ingresos en este período.')}</tbody>
    </table>
</div>

<div class="section">
    <h2>Detalle de Egresos del Período (${egresos.length})</h2>
    <table>
        <thead>${TX_TH}</thead>
        <tbody>${txTable(egrRows, totalEgr, 'color:#dc2626', 'Total egresos activos', 'Sin egresos en este período.')}</tbody>
    </table>
</div>

${canceladas.length > 0 ? `
<div class="section">
    <h2>Transacciones Anuladas (${canceladas.length})</h2>
    <table>
        <thead><tr><th>Fecha</th><th>Descripción</th><th>Tipo</th><th>Categoría</th><th class="right">Monto</th><th>Estado</th></tr></thead>
        <tbody>${canceladas.map(t => `<tr class="tr-cancelled">
            <td>${fmtDate(t.fecha)}</td>
            <td>${t.descripcion}</td>
            <td>${t.tipo === 'income' ? 'Ingreso' : 'Egreso'}</td>
            <td>${t.categoria}</td>
            <td class="right">${cop(t.monto)}</td>
            <td>${estadoBadge(t.estado)}</td>
        </tr>`).join('')}</tbody>
    </table>
</div>` : ''}

<div class="section">
    <h2>Cartera Pendiente (${cartera.length} orden${cartera.length !== 1 ? 'es' : ''})</h2>
    ${carteraSorted.length > 0 ? `
    <table>
        <thead><tr>
            <th>Código</th><th>Cliente</th><th>Vehículo</th><th>F. Completado</th>
            <th class="right">Días</th><th>Urgencia</th><th class="right">Por cobrar</th>
        </tr></thead>
        <tbody>
            ${carteraRows}
            <tr class="tr-total">
                <td colspan="6">Total cartera pendiente</td>
                <td class="right" style="color:#d97706">${cop(totalCartera)}</td>
            </tr>
        </tbody>
    </table>
    <p style="font-size:10px;color:#a1a1aa;margin-top:-10px">
        <span style="background:#fff1f2;padding:1px 5px;border-radius:3px;margin-right:4px">■</span>Crítico (+7 días)
        <span style="background:#fffbeb;padding:1px 5px;border-radius:3px;margin:0 4px">■</span>Alerta (4–7 días)
    </p>` : `<p class="empty-msg" style="padding:12px 0">Sin pagos pendientes. ¡Todas las órdenes han sido cobradas!</p>`}
</div>

<div class="section">
    <h2>Resumen por Método de Pago</h2>
    <table>
        <thead><tr>
            <th>Método</th><th class="right"># Trans.</th>
            <th class="right">Ingresos</th><th class="right">Egresos</th><th class="right">Neto</th>
        </tr></thead>
        <tbody>${metRows}</tbody>
    </table>
</div>

<div class="footer">
    <span>MotoFix Platform — Balance Mensual ${mesLabel}</span>
    <span>Generado el ${fmtDate(new Date().toISOString())}</span>
</div>`

    openPrintWindow(`Balance Mensual — ${mesLabel}`, body)
}

// ── Estado de Resultados P&G ────────────────────────────────

interface PyGData {
    periodo: string
    ventas_brutas: number
    costo_ventas: number
    utilidad_bruta: number
    gastos_operacionales: { concepto: string; monto: number; porcentaje: number }[]
    total_gastos: number
    utilidad_operacional: number
    impuestos_estimados: number
    utilidad_neta: number
    margen_neto: number
}

export function printEstadoResultados(pyg: PyGData): void {
    const sign  = (v: number) => v >= 0 ? '' : '-'
    const abs   = (v: number) => Math.abs(v)
    const tc    = (v: number) => v >= 0 ? 'trend-up' : 'trend-down'

    const gastosRows = pyg.gastos_operacionales.length > 0
        ? pyg.gastos_operacionales.map(g => `<tr>
            <td style="padding-left:20px">${g.concepto}</td>
            <td class="right" style="color:#dc2626">(${cop(g.monto)})</td>
            <td class="right">${g.porcentaje}%</td>
        </tr>`).join('')
        : `<tr><td colspan="3" class="empty-msg">Sin gastos operacionales registrados.</td></tr>`

    const body = `
<div class="header-bar">
    <div>
        <h1>Estado de Resultados</h1>
        <p class="meta" style="margin-bottom:0">Período: <strong>${fmtDate(pyg.periodo + '-01').replace(/\d+\s/, '')}</strong></p>
    </div>
    <div class="header-meta">
        <div>Generado el ${fmtDate(new Date().toISOString())}</div>
        <div style="color:#f97316;font-weight:700">MotoFix Platform</div>
    </div>
</div>

<div class="kpis">
    <div class="kpi kpi-green">
        <div class="kpi-label">Ventas brutas</div>
        <div class="kpi-value">${cop(pyg.ventas_brutas)}</div>
    </div>
    <div class="kpi ${pyg.utilidad_bruta >= 0 ? 'kpi-green' : 'kpi-red'}">
        <div class="kpi-label">Utilidad bruta</div>
        <div class="kpi-value">${cop(pyg.utilidad_bruta)}</div>
    </div>
    <div class="kpi ${pyg.utilidad_neta >= 0 ? 'kpi-green' : 'kpi-red'}">
        <div class="kpi-label">Utilidad neta</div>
        <div class="kpi-value">${cop(pyg.utilidad_neta)}</div>
        <div class="kpi-meta">Margen ${pyg.margen_neto}%</div>
    </div>
</div>

<div class="section">
    <h2>Detalle del Estado de Resultados</h2>
    <table>
        <thead><tr><th>Concepto</th><th class="right">Valor</th><th class="right">% Ventas</th></tr></thead>
        <tbody>
            <tr><td><strong>Ventas brutas</strong></td><td class="right" style="color:#16a34a;font-weight:700">${cop(pyg.ventas_brutas)}</td><td class="right">100%</td></tr>
            <tr><td style="padding-left:16px">Costo de ventas</td><td class="right" style="color:#dc2626">(${cop(pyg.costo_ventas)})</td><td class="right">${pyg.ventas_brutas > 0 ? Math.round((pyg.costo_ventas / pyg.ventas_brutas) * 100) : 0}%</td></tr>
            <tr class="tr-total"><td><strong>Utilidad bruta</strong></td><td class="right ${tc(pyg.utilidad_bruta)}">${sign(pyg.utilidad_bruta)}${cop(abs(pyg.utilidad_bruta))}</td><td class="right">${pyg.ventas_brutas > 0 ? Math.round((pyg.utilidad_bruta / pyg.ventas_brutas) * 100) : 0}%</td></tr>
            <tr><td colspan="3" style="background:#f9f9f9;padding:6px 12px;font-size:10px;color:#a1a1aa;text-transform:uppercase;font-weight:700">Gastos operacionales</td></tr>
            ${gastosRows}
            <tr class="tr-total"><td><strong>Total gastos</strong></td><td class="right" style="color:#dc2626">(${cop(pyg.total_gastos)})</td><td class="right">${pyg.ventas_brutas > 0 ? Math.round((pyg.total_gastos / pyg.ventas_brutas) * 100) : 0}%</td></tr>
            <tr class="tr-total"><td><strong>Utilidad operacional</strong></td><td class="right ${tc(pyg.utilidad_operacional)}">${sign(pyg.utilidad_operacional)}${cop(abs(pyg.utilidad_operacional))}</td><td class="right">${pyg.ventas_brutas > 0 ? Math.round((pyg.utilidad_operacional / pyg.ventas_brutas) * 100) : 0}%</td></tr>
            <tr><td style="padding-left:16px">Impuesto estimado (33%)</td><td class="right" style="color:#dc2626">(${cop(pyg.impuestos_estimados)})</td><td class="right"></td></tr>
            <tr class="tr-total" style="border-top:3px solid #f97316"><td><strong>UTILIDAD NETA</strong></td><td class="right ${tc(pyg.utilidad_neta)}" style="font-size:16px">${sign(pyg.utilidad_neta)}${cop(abs(pyg.utilidad_neta))}</td><td class="right ${tc(pyg.utilidad_neta)}">${pyg.margen_neto}%</td></tr>
        </tbody>
    </table>
</div>

<div class="footer">
    <span>MotoFix Platform — Estado de Resultados</span>
    <span>Generado el ${fmtDate(new Date().toISOString())}</span>
</div>`

    openPrintWindow('Estado de Resultados P&G', body)
}

// ── Reporte de Impuestos ────────────────────────────────────

interface ImpuestosData {
    periodo: string
    iva_generado: number
    iva_descontable: number
    iva_neto: number
    ica: number
    ret_fuente: number
    impoconsumo: number
    total_a_pagar: number
}

export function printReporteImpuestos(datos: ImpuestosData, mesLabel: string): void {
    const body = `
<div class="header-bar">
    <div>
        <h1>Reporte de Impuestos</h1>
        <p class="meta" style="margin-bottom:0">Período: <strong>${mesLabel}</strong></p>
    </div>
    <div class="header-meta">
        <div>Generado el ${fmtDate(new Date().toISOString())}</div>
        <div style="color:#f97316;font-weight:700">MotoFix Platform</div>
    </div>
</div>

<div class="kpis">
    <div class="kpi kpi-red">
        <div class="kpi-label">IVA generado (ventas)</div>
        <div class="kpi-value">${cop(datos.iva_generado)}</div>
    </div>
    <div class="kpi kpi-green">
        <div class="kpi-label">IVA descontable (compras)</div>
        <div class="kpi-value">${cop(datos.iva_descontable)}</div>
    </div>
    <div class="kpi ${datos.iva_neto >= 0 ? 'kpi-red' : 'kpi-green'}">
        <div class="kpi-label">IVA neto a pagar</div>
        <div class="kpi-value">${cop(datos.iva_neto)}</div>
    </div>
</div>

<div class="section">
    <h2>Detalle de Tributos</h2>
    <table>
        <thead><tr><th>Impuesto</th><th>Descripción</th><th class="right">Valor</th></tr></thead>
        <tbody>
            <tr><td><strong>IVA Generado</strong></td><td>IVA cobrado en ventas (19%)</td><td class="right" style="color:#dc2626;font-weight:700">${cop(datos.iva_generado)}</td></tr>
            <tr><td><strong>IVA Descontable</strong></td><td>IVA pagado en compras</td><td class="right" style="color:#16a34a;font-weight:700">${cop(datos.iva_descontable)}</td></tr>
            <tr class="tr-total"><td><strong>IVA Neto</strong></td><td>A declarar ante la DIAN</td><td class="right ${datos.iva_neto >= 0 ? 'trend-down' : 'trend-up'}">${cop(datos.iva_neto)}</td></tr>
            <tr><td><strong>ICA</strong></td><td>Impuesto Industria y Comercio</td><td class="right">${cop(datos.ica)}</td></tr>
            <tr><td><strong>Retención en la Fuente</strong></td><td>Retenciones practicadas</td><td class="right">${cop(datos.ret_fuente)}</td></tr>
            <tr><td><strong>Impoconsumo</strong></td><td>Impuesto al consumo (8%)</td><td class="right">${cop(datos.impoconsumo)}</td></tr>
            <tr class="tr-total" style="border-top:3px solid #f97316"><td colspan="2"><strong>TOTAL A PAGAR PERÍODO</strong></td><td class="right trend-down" style="font-size:16px">${cop(datos.total_a_pagar)}</td></tr>
        </tbody>
    </table>
</div>

<p style="font-size:11px;color:#a1a1aa;margin-top:16px;padding:12px 16px;background:#f9f9f9;border-radius:8px;border-left:3px solid #f97316">
    <strong>Nota:</strong> Los valores aquí presentados son calculados automáticamente a partir de las transacciones registradas.
    Para las declaraciones tributarias oficiales, valide con su contador y utilice los formatos habilitados por la DIAN.
</p>

<div class="footer">
    <span>MotoFix Platform — Reporte Fiscal ${mesLabel}</span>
    <span>Generado el ${fmtDate(new Date().toISOString())}</span>
</div>`

    openPrintWindow(`Reporte Impuestos — ${mesLabel}`, body)
}
