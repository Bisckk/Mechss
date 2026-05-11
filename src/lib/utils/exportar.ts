// CSV + Print export utilities — no external dependencies required

interface Column<T> {
    header: string
    accessor: (row: T) => string | number | null | undefined
}

function escapeCsvCell(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
    }
    return s
}

export function exportToCsv<T>(
    rows: T[],
    columns: Column<T>[],
    filename = 'export'
): void {
    const header = columns.map(c => escapeCsvCell(c.header)).join(',')
    const body = rows.map(row =>
        columns.map(c => escapeCsvCell(c.accessor(row))).join(',')
    ).join('\n')

    const csv = `﻿${header}\n${body}`  // BOM for Excel UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function printSection(elementId: string, title: string): void {
    const el = document.getElementById(elementId)
    if (!el) return

    const content = el.innerHTML
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return

    win.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #000; background: #fff; padding: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
                th { background: #f5f5f5; font-weight: 600; }
                h1 { font-size: 18px; margin-bottom: 16px; }
                .no-print { display: none !important; }
            </style>
        </head>
        <body>
            <h1>${title} — ${new Date().toLocaleDateString('es-CO')}</h1>
            ${content}
        </body>
        </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
}

// Predefined export helpers for common entities

export function exportInventario(items: {
    sku: string; name: string; category: string; stock_quantity: number;
    min_stock: number; sale_price: number; cost_price: number | null;
}[]): void {
    exportToCsv(items, [
        { header: 'SKU',           accessor: r => r.sku },
        { header: 'Nombre',        accessor: r => r.name },
        { header: 'Categoría',     accessor: r => r.category },
        { header: 'Stock',         accessor: r => r.stock_quantity },
        { header: 'Stock Mínimo',  accessor: r => r.min_stock },
        { header: 'Precio Venta',  accessor: r => r.sale_price },
        { header: 'Precio Costo',  accessor: r => r.cost_price ?? '' },
    ], 'inventario')
}

export function exportClientes(clientes: {
    full_name: string; phone: string | null; email: string | null;
    city: string | null; created_at: string;
}[]): void {
    exportToCsv(clientes, [
        { header: 'Nombre',  accessor: r => r.full_name },
        { header: 'Teléfono',accessor: r => r.phone ?? '' },
        { header: 'Email',   accessor: r => r.email ?? '' },
        { header: 'Ciudad',  accessor: r => r.city ?? '' },
        { header: 'Registro',accessor: r => new Date(r.created_at).toLocaleDateString('es-CO') },
    ], 'clientes')
}

export function exportOrdenes(ordenes: {
    tracking_code: string; status: string; vehicle_brand: string | null;
    vehicle_model: string | null; vehicle_plate: string | null;
    estimated_cost: number | null; final_cost: number | null;
    payment_status: string | null; created_at: string;
}[]): void {
    exportToCsv(ordenes, [
        { header: 'Código',        accessor: r => r.tracking_code },
        { header: 'Estado',        accessor: r => r.status },
        { header: 'Marca',         accessor: r => r.vehicle_brand ?? '' },
        { header: 'Modelo',        accessor: r => r.vehicle_model ?? '' },
        { header: 'Placa',         accessor: r => r.vehicle_plate ?? '' },
        { header: 'Presupuesto',   accessor: r => r.estimated_cost ?? '' },
        { header: 'Costo Final',   accessor: r => r.final_cost ?? '' },
        { header: 'Estado Pago',   accessor: r => r.payment_status ?? '' },
        { header: 'Fecha Ingreso', accessor: r => new Date(r.created_at).toLocaleDateString('es-CO') },
    ], 'ordenes')
}

export function exportTransacciones(tx: {
    fecha: string; tipo: string; categoria: string; descripcion: string;
    monto: number; metodo_pago: string | null; estado: string;
}[]): void {
    exportToCsv(tx, [
        { header: 'Fecha',       accessor: r => r.fecha },
        { header: 'Tipo',        accessor: r => r.tipo },
        { header: 'Categoría',   accessor: r => r.categoria },
        { header: 'Descripción', accessor: r => r.descripcion },
        { header: 'Monto',       accessor: r => r.monto },
        { header: 'Método',      accessor: r => r.metodo_pago ?? '' },
        { header: 'Estado',      accessor: r => r.estado },
    ], 'transacciones')
}
