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
