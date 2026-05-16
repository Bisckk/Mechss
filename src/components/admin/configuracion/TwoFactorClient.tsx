'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldOff, QrCode, Loader2, X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type TFAView = 'loading' | 'disabled' | 'enrolling' | 'enabled' | 'disabling'

export default function TwoFactorClient() {
    const [view, setView] = useState<TFAView>('loading')
    const [factorId, setFactorId] = useState('')
    const [challengeId, setChallengeId] = useState('')
    const [qrCode, setQrCode] = useState('')
    const [secret, setSecret] = useState('')
    const [code, setCode] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [working, setWorking] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => { checkStatus() }, [])

    async function checkStatus() {
        const supabase = createClient()
        const { data } = await supabase.auth.mfa.listFactors()
        const totpFactors = data?.totp ?? []
        if (totpFactors.length > 0) {
            setFactorId(totpFactors[0].id)
            setView('enabled')
        } else {
            setView('disabled')
        }
    }

    async function startEnroll() {
        setError(null)
        setWorking(true)
        const supabase = createClient()
        const { data, error: enrollErr } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
        setWorking(false)
        if (enrollErr || !data) {
            setError(enrollErr?.message ?? 'Error al iniciar la configuración')
            return
        }
        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
        const { data: ch } = await supabase.auth.mfa.challenge({ factorId: data.id })
        setChallengeId(ch?.id ?? '')
        setCode('')
        setView('enrolling')
    }

    async function verifyEnroll() {
        if (code.length !== 6 || working) return
        setError(null)
        setWorking(true)
        const supabase = createClient()
        const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
        setWorking(false)
        if (verifyErr) {
            setError('Código incorrecto. Inténtalo de nuevo.')
            setCode('')
            const { data: ch } = await supabase.auth.mfa.challenge({ factorId })
            setChallengeId(ch?.id ?? '')
            return
        }
        setSuccess(true)
        setTimeout(() => { setSuccess(false); setView('enabled') }, 1400)
    }

    async function startDisable() {
        setError(null)
        setCode('')
        const supabase = createClient()
        const { data: ch } = await supabase.auth.mfa.challenge({ factorId })
        setChallengeId(ch?.id ?? '')
        setView('disabling')
    }

    async function confirmDisable() {
        if (code.length !== 6 || working) return
        setError(null)
        setWorking(true)
        const supabase = createClient()
        const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
        if (verifyErr) {
            setError('Código incorrecto.')
            setCode('')
            setWorking(false)
            const { data: ch } = await supabase.auth.mfa.challenge({ factorId })
            setChallengeId(ch?.id ?? '')
            return
        }
        const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId })
        setWorking(false)
        if (unenrollErr) { setError(unenrollErr.message); return }
        setFactorId('')
        setView('disabled')
    }

    if (view === 'loading') {
        return (
            <div className="flex items-center gap-2 text-zinc-500 py-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Verificando estado 2FA…</span>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-start gap-3">
                    {view === 'enabled'
                        ? <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                        : <Shield className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
                    }
                    <div>
                        <p className="text-sm font-semibold text-white">Autenticación de Dos Factores (2FA)</p>
                        <p className="text-xs text-zinc-500">
                            {view === 'enabled'
                                ? 'Cuenta protegida con TOTP — se pedirá el código en cada inicio de sesión'
                                : 'Añade una capa extra de seguridad con Google Authenticator o Authy'}
                        </p>
                    </div>
                </div>
                {view === 'enabled' && (
                    <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
                        Activo
                    </span>
                )}
            </div>

            {/* Idle buttons */}
            {view === 'disabled' && (
                <button
                    onClick={startEnroll}
                    disabled={working}
                    className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    Activar 2FA
                </button>
            )}

            {view === 'enabled' && (
                <button
                    onClick={startDisable}
                    className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                    <ShieldOff className="w-4 h-4" />
                    Desactivar 2FA
                </button>
            )}

            {/* Enroll flow */}
            {view === 'enrolling' && (
                <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-5">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-orange-400" />
                        Configura tu autenticador
                    </h3>

                    <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
                        <li>Abre <span className="text-white font-medium">Google Authenticator</span> o <span className="text-white font-medium">Authy</span></li>
                        <li>Escanea el código QR o ingresa el código manual</li>
                        <li>Ingresa el código de 6 dígitos generado</li>
                    </ol>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {qrCode && (
                            <div className="bg-white p-2 rounded-xl shrink-0">
                                <img src={qrCode} alt="QR para 2FA" className="w-32 h-32" />
                            </div>
                        )}
                        <div className="flex-1 space-y-2 w-full">
                            <p className="text-xs text-zinc-400 font-medium">Código manual:</p>
                            <code className="block text-xs font-mono text-orange-400 bg-orange-500/5 border border-orange-500/15 rounded-lg px-3 py-2 tracking-widest break-all select-all">
                                {secret.match(/.{1,4}/g)?.join(' ') ?? secret}
                            </code>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-zinc-400 font-medium">Código de verificación</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={e => e.key === 'Enter' && verifyEnroll()}
                                placeholder="000000"
                                autoFocus
                                autoComplete="one-time-code"
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-center text-lg font-mono tracking-[0.4em] focus:outline-none focus:border-orange-500/50 transition-colors placeholder:tracking-normal placeholder:text-zinc-600"
                            />
                            <button
                                onClick={verifyEnroll}
                                disabled={code.length !== 6 || working || success}
                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2"
                            >
                                {success
                                    ? <CheckCircle2 className="w-4 h-4" />
                                    : working
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : 'Verificar'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-rose-400 bg-rose-500/8 border border-rose-500/15 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                        onClick={() => { setView('disabled'); setQrCode(''); setSecret(''); setCode(''); setError(null) }}
                        className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                        <X className="w-3 h-3" /> Cancelar
                    </button>
                </div>
            )}

            {/* Disable confirmation */}
            {view === 'disabling' && (
                <div className="bg-black/30 border border-rose-500/20 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                        <ShieldOff className="w-4 h-4" />
                        Desactivar 2FA
                    </h3>
                    <p className="text-xs text-zinc-400">Ingresa tu código de autenticador actual para confirmar la desactivación.</p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={e => e.key === 'Enter' && confirmDisable()}
                            placeholder="000000"
                            autoFocus
                            autoComplete="one-time-code"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-center text-lg font-mono tracking-[0.4em] focus:outline-none focus:border-rose-500/50 transition-colors placeholder:tracking-normal placeholder:text-zinc-600"
                        />
                        <button
                            onClick={confirmDisable}
                            disabled={code.length !== 6 || working}
                            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2"
                        >
                            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                        </button>
                    </div>

                    {error && (
                        <p className="text-xs text-rose-400 bg-rose-500/8 border border-rose-500/15 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                        onClick={() => { setView('enabled'); setCode(''); setError(null) }}
                        className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                        <X className="w-3 h-3" /> Cancelar
                    </button>
                </div>
            )}
        </div>
    )
}
