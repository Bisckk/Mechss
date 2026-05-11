'use client'

import { useState, useTransition } from 'react'
import { MessageCircle, CheckCircle, Eye, EyeOff, Loader2, AlertTriangle, Info } from 'lucide-react'
import { saveWhatsAppConfigAction, type WhatsAppConfig } from '@/lib/actions/whatsapp'

interface Props { initialConfig: WhatsAppConfig | null }

export default function WhatsAppConfigClient({ initialConfig }: Props) {
    const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false)
    const [phoneNumberId, setPhoneNumberId] = useState(initialConfig?.phone_number_id ?? '')
    const [accessToken, setAccessToken] = useState(initialConfig?.access_token ?? '')
    const [webhookToken, setWebhookToken] = useState(initialConfig?.webhook_verify_token ?? '')
    const [sendOnReceived, setSendOnReceived] = useState(initialConfig?.send_on_received ?? true)
    const [sendOnCompleted, setSendOnCompleted] = useState(initialConfig?.send_on_completed ?? true)
    const [sendOnDelivered, setSendOnDelivered] = useState(initialConfig?.send_on_delivered ?? false)
    const [sendReminder, setSendReminder] = useState(initialConfig?.send_appointment_reminder ?? false)
    const [showToken, setShowToken] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        setError(''); setSaved(false)
        startTransition(async () => {
            const res = await saveWhatsAppConfigAction({
                phone_number_id: phoneNumberId,
                access_token: accessToken,
                webhook_verify_token: webhookToken || undefined,
                enabled,
                send_on_received:          sendOnReceived,
                send_on_completed:         sendOnCompleted,
                send_on_delivered:         sendOnDelivered,
                send_appointment_reminder: sendReminder,
            })
            if (!res.ok) { setError(res.error); return }
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        })
    }

    const toggleRow = (label: string, value: boolean, onChange: (v: boolean) => void) => (
        <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-sm text-zinc-300">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors flex-shrink-0 ${value ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </div>
    )

    return (
        <section className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-5">
            {/* Title + master toggle */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-400" /> WhatsApp Business
                </h2>
                <button
                    onClick={() => setEnabled(!enabled)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors flex-shrink-0 ${enabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2.5 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300/80 leading-relaxed">
                    Necesitas una cuenta de <strong>Meta Business</strong> con la API de WhatsApp habilitada. Obtén el Phone Number ID y Access Token desde el panel de desarrolladores de Meta.
                </p>
            </div>

            {/* Credentials */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Phone Number ID</label>
                    <input
                        type="text"
                        value={phoneNumberId}
                        onChange={e => setPhoneNumberId(e.target.value)}
                        placeholder="1234567890"
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-zinc-700"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Access Token</label>
                    <div className="relative">
                        <input
                            type={showToken ? 'text' : 'password'}
                            value={accessToken}
                            onChange={e => setAccessToken(e.target.value)}
                            placeholder="EAAxxxxxxxx..."
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pr-10 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-zinc-700"
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Webhook Verify Token <span className="text-zinc-600 normal-case">(opcional)</span>
                    </label>
                    <input
                        type="text"
                        value={webhookToken}
                        onChange={e => setWebhookToken(e.target.value)}
                        placeholder="mi_token_secreto"
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-zinc-700"
                    />
                </div>
            </div>

            {/* Notification toggles */}
            <div className="bg-black/20 border border-white/5 rounded-xl px-4 py-1">
                {toggleRow('Notificar al recibir vehículo', sendOnReceived, setSendOnReceived)}
                {toggleRow('Notificar al completar reparación', sendOnCompleted, setSendOnCompleted)}
                {toggleRow('Notificar al entregar vehículo', sendOnDelivered, setSendOnDelivered)}
                {toggleRow('Recordatorio de cita', sendReminder, setSendReminder)}
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                </div>
            )}
            {saved && (
                <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-emerald-400">Configuración de WhatsApp guardada.</p>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    Guardar WhatsApp
                </button>
            </div>
        </section>
    )
}
