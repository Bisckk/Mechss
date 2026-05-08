'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { X, Printer, CheckCircle2, Wrench, Hash, ArrowRight, Car, FileText } from 'lucide-react'
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

// ── Thermal receipt HTML — 58 mm roll ────────────────────────────────────────
function buildThermalHTML(data: PrintTicketData, qrDataUrl: string, trackingUrl: string) {
    const date    = new Date(data.created_at).toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
    const vehicle = [data.vehicle_brand, data.vehicle_model].filter(Boolean).join(' ') || '—'
    const sep     = '- - - - - - - - - - - - - -'

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>${data.tracking_code}</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  body {
    font-family:'Courier New',Courier,monospace;
    font-size:11px; line-height:1.45;
    color:#000; background:#fff;
    width:58mm; padding:5mm 3.5mm 10mm;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .c   { text-align:center; }
  .b   { font-weight:900; }
  .lbl { font-size:8px; text-transform:uppercase; letter-spacing:1.2px; opacity:.45; margin-bottom:2px; }
  .sep { color:#ccc; font-size:9px; margin:5px 0; }
  .code-box {
    display:inline-block; border:2.5px solid #000; border-radius:3px;
    padding:4px 10px; font-size:16px; font-weight:900;
    letter-spacing:2px; margin:4px 0;
  }
  .plate {
    display:inline-block; border:1px solid #000; border-radius:2px;
    padding:1px 5px; font-size:9px; font-weight:700; letter-spacing:1.5px;
  }
  .qr img { display:block; margin:5px auto 3px; width:115px; height:115px; }
  .url    { font-size:8.5px; opacity:.5; word-break:break-all; }
  .foot   { font-size:7.5px; opacity:.35; margin-top:7px; }
  .name   { font-size:13px; font-weight:900; letter-spacing:.5px; }
  .issue  { font-size:10px; line-height:1.55; margin-top:3px; }
</style>
</head>
<body>
  <p class="c name">${data.workshop_name.toUpperCase()}</p>
  <p class="c lbl" style="margin-top:2px">Comprobante de Ingreso al Taller</p>
  <p class="c sep">${sep}</p>

  <p class="c lbl">N.° de Orden</p>
  <p class="c"><span class="code-box">${data.tracking_code}</span></p>
  <p class="c sep">${sep}</p>

  <p class="lbl">Vehículo</p>
  <p class="b" style="margin-top:2px">${vehicle}</p>
  ${data.vehicle_plate ? `<p style="margin-top:3px"><span class="plate">${data.vehicle_plate}</span></p>` : ''}

  <p class="lbl" style="margin-top:8px">Fecha de ingreso</p>
  <p>${date}</p>
  <p class="c sep">${sep}</p>

  <p class="lbl">Motivo de ingreso</p>
  <p class="issue">${data.reported_issue}</p>
  <p class="c sep">${sep}</p>

  <p class="c lbl">Rastrea el estado de tu vehículo</p>
  ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR"/></div>` : ''}
  <p class="c url">${trackingUrl}</p>
  <p class="c" style="margin-top:5px"><span class="plate" style="font-size:10px;letter-spacing:2px">${data.tracking_code}</span></p>
  <p class="c sep">${sep}</p>

  <p class="c foot">Guarda este comprobante &bull; ${data.workshop_name}</p>
</body>
</html>`
}

// Inyecta un iframe oculto y dispara la impresión sin abrir ninguna ventana emergente
function printViaIframe(html: string) {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;'
    document.body.appendChild(iframe)
    iframe.contentDocument!.open()
    iframe.contentDocument!.write(html)
    iframe.contentDocument!.close()
    iframe.contentWindow!.focus()
    setTimeout(() => {
        iframe.contentWindow!.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 400)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PrintTicketModal({ open, onClose, data }: Props) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const modalRef    = useRef<HTMLDivElement>(null)
    const [qrDataUrl, setQrDataUrl] = useState('')

    const trackingUrl = data && typeof window !== 'undefined'
        ? `${window.location.origin}/t/${data.workshop_slug}`
        : ''

    useEffect(() => {
        if (!data || !open || !trackingUrl) return
        QRCode.toDataURL(trackingUrl, {
            width: 220, margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
        }).then(url => setQrDataUrl(url)).catch(() => {})
    }, [data, open, trackingUrl])

    useEffect(() => {
        const backdrop = backdropRef.current
        const modal    = modalRef.current
        if (!backdrop || !modal) return

        if (open) {
            gsap.set(backdrop, { display: 'flex', opacity: 0 })
            gsap.set(modal,    { y: 28, opacity: 0, scale: 0.96 })
            gsap.to(backdrop,  { opacity: 1, duration: 0.28, ease: 'expo.out' })
            gsap.to(modal,     { y: 0, opacity: 1, scale: 1, duration: 0.38, ease: 'expo.out', force3D: true, delay: 0.04 })
        } else {
            gsap.to(modal,    { y: 16, opacity: 0, scale: 0.96, duration: 0.18, ease: 'expo.in' })
            gsap.to(backdrop, {
                opacity: 0, duration: 0.22, ease: 'expo.in',
                onComplete: () => { gsap.set(backdrop, { display: 'none' }) },
            })
        }
    }, [open])

    const handlePrint = () => {
        if (!data) return
        printViaIframe(buildThermalHTML(data, qrDataUrl, trackingUrl))
    }

    if (!data) return null

    const date    = new Date(data.created_at).toLocaleString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
    const vehicle = [data.vehicle_brand, data.vehicle_model].filter(Boolean).join(' ') || '—'

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            style={{ display: 'none' }}
        >
            <div
                ref={modalRef}
                className="w-full max-w-sm bg-[#0d0d0f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Accent bar */}
                <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-tight">Orden creada</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">Comparte el código con el cliente</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl text-zinc-500 hover:text-white hover:bg-white/8 transition-colors flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tracking code — hero */}
                <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Código de orden</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2 bg-orange-500/[0.07] border border-orange-500/20 rounded-xl px-4 py-3">
                            <Hash className="w-4 h-4 text-orange-400/60 flex-shrink-0" />
                            <span className="text-xl font-black text-orange-400 font-mono tracking-widest">{data.tracking_code}</span>
                        </div>
                        {/* Workshop icon */}
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                            {data.workshop_logo
                                ? <img src={data.workshop_logo} alt="" className="w-8 h-8 object-contain rounded-lg" />
                                : <Wrench className="w-5 h-5 text-zinc-500" />
                            }
                        </div>
                    </div>
                </div>

                {/* Info rows */}
                <div className="divide-y divide-white/[0.05]">
                    {/* Vehicle */}
                    <div className="flex items-center gap-3 px-5 py-3.5">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
                            <Car className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Vehículo</p>
                            <p className="text-sm font-bold text-white leading-tight">{vehicle}</p>
                        </div>
                        {data.vehicle_plate && (
                            <span className="text-[10px] font-black font-mono tracking-widest text-zinc-400 bg-zinc-800 border border-white/[0.08] rounded-lg px-2 py-1 flex-shrink-0">
                                {data.vehicle_plate}
                            </span>
                        )}
                    </div>

                    {/* Issue */}
                    <div className="flex items-start gap-3 px-5 py-3.5">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Motivo de ingreso</p>
                            <p className="text-sm text-zinc-300 leading-relaxed mt-0.5">{data.reported_issue}</p>
                        </div>
                    </div>
                </div>

                {/* QR strip */}
                <div className="mx-5 mb-5 mt-4 rounded-xl overflow-hidden border border-white/[0.07] flex items-center gap-0">
                    {/* QR */}
                    <div className="bg-white p-3 flex-shrink-0">
                        {qrDataUrl
                            ? <img src={qrDataUrl} alt="QR" className="w-16 h-16 block" />
                            : <div className="w-16 h-16 bg-zinc-200 animate-pulse rounded" />
                        }
                    </div>
                    {/* Info */}
                    <div className="flex-1 px-4 py-3 bg-zinc-900/60 min-w-0">
                        <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-1">Rastrea tu vehículo</p>
                        <p className="text-[10px] text-zinc-500 leading-relaxed break-all">{trackingUrl}</p>
                        <p className="text-[10px] font-mono font-black text-zinc-300 mt-1.5 tracking-widest">{data.tracking_code}</p>
                    </div>
                </div>

                {/* Date footer */}
                <div className="px-5 pb-4 -mt-2">
                    <p className="text-[10px] text-zinc-600">{date} · {data.workshop_name}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-5 pb-5 border-t border-white/[0.06] pt-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.09] transition-all active:scale-95"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                    >
                        Continuar
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
