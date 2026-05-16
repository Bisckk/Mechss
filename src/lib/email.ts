import type { Transporter } from 'nodemailer'

// ── Shared Nodemailer transport factory ──────────────────────

let _transporter: Transporter | null = null

async function getTransporter(): Promise<Transporter> {
    if (_transporter) return _transporter
    const nodemailer = (await import('nodemailer')).default
    _transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
    })
    return _transporter
}

const FROM = () => `"MotoFix" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`

const BASE_STYLE = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 600px; margin: 0 auto;
    background-color: #09090b; color: #f4f4f5;
    padding: 36px 32px; border-radius: 12px;
    border: 1px solid #27272a;
`

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
    const t = await getTransporter()
    await t.sendMail({ from: FROM(), ...opts })
}

// ── Email templates ──────────────────────────────────────────

function logo() {
    return `<h1 style="color:#f97316;margin:0 0 28px;font-weight:900;font-size:26px;letter-spacing:-0.5px">Moto<span style="color:#ffffff">Fix</span></h1>`
}

function footer() {
    return `<p style="color:#52525b;font-size:12px;margin-top:32px;border-top:1px solid #27272a;padding-top:20px;line-height:1.6">
        Este es un mensaje automático. Por favor no respondas a este correo.
    </p>`
}

export function buildTrialWelcomeEmail(workshopName: string, trialDays: number): string {
    return `<div style="${BASE_STYLE}">
        ${logo()}
        <h2 style="font-size:20px;font-weight:700;margin:0 0 10px">¡Bienvenido a MotoFix, ${workshopName}!</h2>
        <p style="color:#a1a1aa;line-height:1.7;margin:0 0 20px;font-size:15px">
            Tu período de prueba de <strong style="color:#f97316">${trialDays} días</strong> ha comenzado.
            Explora todas las funcionalidades sin restricciones: gestión de clientes, taller, inventario, contabilidad y mucho más.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
            style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-bottom:24px">
            Ir a mi taller →
        </a>
        <p style="color:#71717a;font-size:13px;line-height:1.6">
            Si tienes preguntas, responde este correo o escríbenos. Estamos para ayudarte.
        </p>
        ${footer()}
    </div>`
}

export function buildTrialExpiringEmail(workshopName: string, daysLeft: number): string {
    const urgent = daysLeft <= 1
    const color = urgent ? '#f43f5e' : '#f97316'
    const days = daysLeft === 0 ? 'vence hoy' : daysLeft === 1 ? 'vence mañana' : `vence en ${daysLeft} días`
    return `<div style="${BASE_STYLE}">
        ${logo()}
        <div style="background:${color}18;border:1px solid ${color}40;border-radius:10px;padding:14px 18px;margin-bottom:24px">
            <p style="color:${color};font-size:14px;font-weight:700;margin:0">
                ⚠️ Tu prueba ${days}
            </p>
        </div>
        <h2 style="font-size:20px;font-weight:700;margin:0 0 10px">Tu período de prueba está por terminar</h2>
        <p style="color:#a1a1aa;line-height:1.7;margin:0 0 20px;font-size:15px">
            Hola <strong style="color:#f4f4f5">${workshopName}</strong>, para seguir usando MotoFix sin interrupciones
            activa tu plan antes de que venza el período de prueba.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin"
            style="display:inline-block;background:${color};color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-bottom:24px">
            Activar mi plan ahora →
        </a>
        ${footer()}
    </div>`
}

export function buildSubscriptionExpiringEmail(workshopName: string, daysLeft: number, endsAt: string): string {
    const dateStr = new Date(endsAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    return `<div style="${BASE_STYLE}">
        ${logo()}
        <h2 style="font-size:20px;font-weight:700;margin:0 0 10px">Tu suscripción vence pronto</h2>
        <p style="color:#a1a1aa;line-height:1.7;margin:0 0 20px;font-size:15px">
            Hola <strong style="color:#f4f4f5">${workshopName}</strong>, tu suscripción actual vence el
            <strong style="color:#f97316">${dateStr}</strong> (en ${daysLeft} días).
            Renueva ahora para no perder el acceso.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin"
            style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-bottom:24px">
            Renovar suscripción →
        </a>
        ${footer()}
    </div>`
}

export function buildSubscriptionActivatedEmail(workshopName: string, planName: string, endsAt: string): string {
    const dateStr = new Date(endsAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    return `<div style="${BASE_STYLE}">
        ${logo()}
        <div style="background:#10b98118;border:1px solid #10b98140;border-radius:10px;padding:14px 18px;margin-bottom:24px">
            <p style="color:#10b981;font-size:14px;font-weight:700;margin:0">✓ Pago confirmado</p>
        </div>
        <h2 style="font-size:20px;font-weight:700;margin:0 0 10px">¡Tu plan está activo!</h2>
        <p style="color:#a1a1aa;line-height:1.7;margin:0 0 20px;font-size:15px">
            Hola <strong style="color:#f4f4f5">${workshopName}</strong>, tu plan
            <strong style="color:#f97316">${planName}</strong> ha sido activado con éxito.
            Tu próxima fecha de renovación es el <strong style="color:#f4f4f5">${dateStr}</strong>.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin"
            style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-bottom:24px">
            Ir a mi taller →
        </a>
        ${footer()}
    </div>`
}
