'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { X, Printer, CheckCircle2, Wrench, Smartphone } from 'lucide-react'
import QRCode from 'qrcode'

interface PrintTicketData {
    tracking_code: string
    workshop_name: string
    workshop_slug: string
    workshop_logo: string | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_plate: string | null
    reported_issue: string
    created_at: string
}

interface Props {
    open: boolean
    onClose: () => void
    data: PrintTicketData | null
}

export default function PrintTicketModal({ open, onClose, data }: Props) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)
    const [qrDataUrl, setQrDataUrl] = useState<string>('')

    const trackingUrl = data
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${data.workshop_slug}`
        : ''

    useEffect(() => {
        if (!data || !open) return
        QRCode.toDataURL(trackingUrl, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
        }).then(url => setQrDataUrl(url)).catch(() => { })
    }, [data, open, trackingUrl])

    useEffect(() => {
        const backdrop = backdropRef.current
        const modal = modalRef.current
        if (!backdrop || !modal) return

        if (open) {
            gsap.set(backdrop, { display: 'flex', opacity: 0 })
            gsap.set(modal, { scale: 0.92, opacity: 0, y: 16 })
            gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'expo.out', force3D: true })
            gsap.to(modal, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'expo.out', force3D: true, delay: 0.05 })
        } else {
            gsap.to(backdrop, {
                opacity: 0, duration: 0.22, ease: 'expo.in',
                onComplete: () => { gsap.set(backdrop, { display: 'none' }) }
            })
        }
    }, [open])

    const handlePrint = () => window.print()

    if (!data) return null

    const dateStr = new Date(data.created_at).toLocaleString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })

    return (
        <>
            {/* Print styles */}
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    #print-ticket { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; }
                    #print-ticket * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                @media screen {
                    #print-ticket { display: none; }
                }
            `}</style>

            {/* Print-only version */}
            <div id="print-ticket" className="p-8 font-sans text-black bg-white min-h-screen">
                <PrintContent data={data} qrDataUrl={qrDataUrl} trackingUrl={trackingUrl} dateStr={dateStr} />
            </div>

            {/* Screen modal */}
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md items-center justify-center p-4"
                style={{ display: 'none' }}
            >
                <div
                    ref={modalRef}
                    className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Orden creada exitosamente</p>
                                <p className="text-xs text-zinc-500">Comparte el código con el cliente</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/8 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Ticket Preview */}
                    <div className="p-6">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                            <PrintContent data={data} qrDataUrl={qrDataUrl} trackingUrl={trackingUrl} dateStr={dateStr} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm font-semibold text-white hover:bg-white/8 transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold text-white transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// ── Shared ticket content ──────────────────────────────────

function PrintContent({ data, qrDataUrl, trackingUrl, dateStr }: {
    data: PrintTicketData
    qrDataUrl: string
    trackingUrl: string
    dateStr: string
}) {
    return (
        <div className="bg-white text-black p-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-100">
                <div className="flex items-center gap-3">
                    {data.workshop_logo ? (
                        <img src={data.workshop_logo} alt="Logo" className="h-12 w-auto object-contain" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-lg font-black text-gray-900 leading-tight">{data.workshop_name}</h1>
                        <p className="text-xs text-gray-500">Comprobante de Ingreso</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Código</p>
                    <p className="text-2xl font-black text-orange-500 font-mono tracking-wider">{data.tracking_code}</p>
                </div>
            </div>

            {/* Vehicle & Issue */}
            <div className="mb-5 space-y-2">
                <div className="flex gap-3">
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Vehículo</p>
                        <p className="text-sm font-bold text-gray-800">
                            {data.vehicle_brand} {data.vehicle_model}
                        </p>
                        {data.vehicle_plate && (
                            <p className="text-xs font-mono font-black text-gray-600 mt-0.5 tracking-widest">{data.vehicle_plate}</p>
                        )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Fecha de ingreso</p>
                        <p className="text-xs font-semibold text-gray-700">{dateStr}</p>
                    </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <p className="text-[10px] text-orange-400 uppercase font-bold tracking-wider mb-0.5">Motivo de ingreso</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{data.reported_issue}</p>
                </div>
            </div>

            {/* QR + Instructions */}
            <div className="flex gap-4 items-start bg-gray-900 rounded-2xl p-4 text-white">
                <div className="flex-shrink-0">
                    {qrDataUrl ? (
                        <div className="bg-white p-2 rounded-xl">
                            <img src={qrDataUrl} alt="QR Code" className="w-20 h-20" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-gray-700 rounded-xl animate-pulse" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Seguimiento en tiempo real</p>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed mb-2">
                        Escanea el QR o ingresa a la página y usa tu código para ver el progreso de tu vehículo en tiempo real.
                    </p>
                    <p className="text-[11px] font-mono text-gray-400 break-all">{trackingUrl}</p>
                    <div className="mt-2 bg-white/10 rounded-lg px-2 py-1 inline-block">
                        <p className="text-xs font-mono font-black text-white tracking-widest">{data.tracking_code}</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400">Guarda este comprobante · {data.workshop_name}</p>
            </div>
        </div>
    )
}
