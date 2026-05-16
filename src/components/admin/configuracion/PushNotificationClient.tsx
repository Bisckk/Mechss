'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, Loader2, AlertTriangle } from 'lucide-react'

type PushState = 'loading' | 'unsupported' | 'denied' | 'inactive' | 'subscribing' | 'active'

function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(b64)
    const arr = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
    return arr
}

export default function PushNotificationClient() {
    const [state, setState] = useState<PushState>('loading')
    const [endpoint, setEndpoint] = useState<string | null>(null)
    const [working, setWorking] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    useEffect(() => {
        if (!vapidKey) { setState('unsupported'); return }
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            setState('unsupported')
            return
        }
        if (Notification.permission === 'denied') {
            setState('denied')
            return
        }
        navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription()
            if (sub) {
                setEndpoint(sub.endpoint)
                setState('active')
            } else {
                setState('inactive')
            }
        }).catch(() => setState('inactive'))
    }, [vapidKey])

    async function subscribe() {
        if (!vapidKey) return
        setError(null)
        setWorking(true)
        setState('subscribing')
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                setState('denied')
                setWorking(false)
                return
            }
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
            })
            const subJson = sub.toJSON()
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subJson),
            })
            if (!res.ok) throw new Error('Error al guardar suscripción')
            setEndpoint(sub.endpoint)
            setState('active')
        } catch (e: any) {
            setError(e.message ?? 'Error al activar notificaciones')
            setState('inactive')
        } finally {
            setWorking(false)
        }
    }

    async function unsubscribe() {
        setError(null)
        setWorking(true)
        try {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()
            if (sub) {
                await sub.unsubscribe()
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                })
            }
            setEndpoint(null)
            setState('inactive')
        } catch (e: any) {
            setError(e.message ?? 'Error al desactivar')
        } finally {
            setWorking(false)
        }
    }

    if (state === 'loading') {
        return (
            <div className="flex items-center gap-2 text-zinc-500 py-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Verificando notificaciones…</span>
            </div>
        )
    }

    if (state === 'unsupported') {
        return (
            <div className="flex items-start gap-3">
                <BellOff className="w-5 h-5 text-zinc-600 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-zinc-500">Notificaciones Push</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                        {!vapidKey ? 'VAPID keys no configuradas — ejecuta scripts/generate-vapid.mjs' : 'Tu navegador no soporta notificaciones push'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-start gap-3">
                    {state === 'active'
                        ? <BellRing className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                        : <Bell className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
                    }
                    <div>
                        <p className="text-sm font-semibold text-white">Notificaciones Push</p>
                        <p className="text-xs text-zinc-500">
                            {state === 'active'
                                ? 'Recibirás alertas de nuevas órdenes y cambios de estado'
                                : state === 'denied'
                                ? 'Bloqueadas por el navegador — actívalas desde la configuración del sitio'
                                : 'Recibe alertas en tiempo real de nuevas órdenes y estados'}
                        </p>
                    </div>
                </div>
                {state === 'active' && (
                    <span className="text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
                        Activas
                    </span>
                )}
                {state === 'denied' && (
                    <span className="text-[10px] font-bold bg-zinc-800 text-zinc-500 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
                        Bloqueadas
                    </span>
                )}
            </div>

            {state === 'denied' && (
                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/15 rounded-lg px-3 py-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Para desbloquearlas, haz clic en el candado de la barra de direcciones y permite notificaciones.</span>
                </div>
            )}

            {(state === 'inactive' || state === 'subscribing') && (
                <button
                    onClick={subscribe}
                    disabled={working || state === 'subscribing'}
                    className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                    Activar notificaciones
                </button>
            )}

            {state === 'active' && (
                <button
                    onClick={unsubscribe}
                    disabled={working}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
                    Desactivar
                </button>
            )}

            {error && (
                <p className="text-xs text-rose-400 bg-rose-500/8 border border-rose-500/15 rounded-lg px-3 py-2">{error}</p>
            )}
        </div>
    )
}
