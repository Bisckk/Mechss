import type { Transporter } from 'nodemailer'

// ── Shared Nodemailer transport factory ──────────────────────

let _transporter: Transporter | null = null

async function getTransporter(): Promise<Transporter> {
    if (_transporter) return _transporter
    const nodemailer = (await import('nodemailer')).default
    _transporter = nodemailer.createTransport({
        host:    process.env.SMTP_HOST,
        port:    Number(process.env.SMTP_PORT) || 587,
        secure:  process.env.SMTP_SECURE === 'true',
        auth:    { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls:     { ciphers: 'SSLv3', rejectUnauthorized: false },
    })
    return _transporter
}

const FROM = () => `"MotoFix" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
    try {
        const t = await getTransporter()
        await t.sendMail({ from: FROM(), ...opts })
    } catch { /* non-critical — fire-and-forget */ }
}

// ── Shared primitives ─────────────────────────────────────────

function emailShell(accentGradient: string, body: string, workshopName = 'el taller'): string {
    return `
<div style="max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;border-radius:16px;overflow:hidden;border:1px solid #27272a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">

  <!-- Header band -->
  <div style="background:${accentGradient};padding:30px 36px 28px">
    <div style="font-size:21px;font-weight:900;color:#fff;letter-spacing:-0.5px">&#128295; MotoFix</div>
    <div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px;text-transform:uppercase;letter-spacing:.08em">${workshopName}</div>
  </div>

  <!-- Body -->
  <div style="padding:32px 36px">
    ${body}
  </div>

  <!-- Footer -->
  <div style="border-top:1px solid #27272a;padding:18px 36px;background:#0a0a0a">
    <p style="color:#52525b;font-size:11px;margin:0;line-height:1.6">
      Mensaje automático de <strong style="color:#71717a">${workshopName}</strong> vía MotoFix Platform. Por favor no respondas a este correo.
    </p>
  </div>
</div>`
}

function trackingCard(trackingCode: string): string {
    return `
<div style="background:#0a0a0a;border:2px solid #f97316;border-radius:12px;padding:18px 24px;text-align:center;margin:0 0 20px">
  <div style="color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px">Código de rastreo</div>
  <div style="color:#f97316;font-size:30px;font-weight:900;letter-spacing:5px;font-family:'Courier New',monospace">#${trackingCode}</div>
</div>`
}

function vehicleCard(vehicleDesc: string): string {
    return `
<div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:14px 18px;margin:0 0 20px;display:flex;align-items:center;gap:12px">
  <div style="background:#3f3f46;border-radius:8px;padding:8px;font-size:18px;line-height:1">&#128663;</div>
  <div>
    <div style="color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px">Vehículo</div>
    <div style="color:#f4f4f5;font-size:15px;font-weight:700">${vehicleDesc}</div>
  </div>
</div>`
}

function ctaButton(href: string, label: string, color = '#f97316'): string {
    return `<a href="${href}" style="display:block;background:${color};color:#fff;text-decoration:none;border-radius:10px;padding:13px 28px;text-align:center;font-size:14px;font-weight:700;margin:0 0 20px;letter-spacing:0.2px">${label} &#8594;</a>`
}

// ── Transactional repair templates ────────────────────────────

export function buildRepairReceivedEmail(
    clientName: string,
    vehicleDesc: string,
    trackingCode: string,
    workshopName: string,
    trackingUrl: string
): string {
    const body = `
<div style="margin:0 0 6px">
  <div style="display:inline-block;background:#f97316;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">
    &#10003; Vehículo recibido
  </div>
</div>
<h2 style="font-size:22px;font-weight:900;margin:0 0 8px;color:#fff;line-height:1.2">Tu orden de servicio está activa</h2>
<p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 24px">
  Hola <strong style="color:#f4f4f5">${clientName}</strong>, hemos recibido tu vehículo en el taller.
  Usa tu código de rastreo para ver el progreso en tiempo real.
</p>
${trackingCard(trackingCode)}
${vehicleCard(vehicleDesc)}
${ctaButton(trackingUrl, 'Rastrear mi orden')}
<p style="color:#71717a;font-size:13px;line-height:1.6;margin:0">
  Recibirás una notificación cuando tu vehículo esté listo para recoger. Si tienes dudas, comunícate directamente con el taller.
</p>`
    return emailShell('linear-gradient(135deg,#c2410c 0%,#ea580c 60%,#f97316 100%)', body, workshopName)
}

export function buildRepairCompletedEmail(
    clientName: string,
    vehicleDesc: string,
    trackingCode: string,
    workshopName: string,
    totalAmount: number | null,
    trackingUrl: string
): string {
    const amountBlock = totalAmount
        ? `<div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px 18px;margin:0 0 20px;text-align:center">
             <div style="color:#4ade80;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Total a pagar</div>
             <div style="color:#fff;font-size:24px;font-weight:900">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalAmount)}</div>
           </div>`
        : ''

    const body = `
<div style="margin:0 0 6px">
  <div style="display:inline-block;background:#22c55e;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">
    &#10003; Listo para recoger
  </div>
</div>
<h2 style="font-size:22px;font-weight:900;margin:0 0 8px;color:#fff;line-height:1.2">&#127881; ¡Tu vehículo está listo!</h2>
<p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 24px">
  Hola <strong style="color:#f4f4f5">${clientName}</strong>, el servicio de tu vehículo ha sido completado.
  Ya puedes pasar a recogerlo al taller.
</p>
${vehicleCard(vehicleDesc)}
${amountBlock}
${trackingCard(trackingCode)}
${ctaButton(trackingUrl, 'Ver detalles del servicio', '#22c55e')}
<p style="color:#71717a;font-size:13px;line-height:1.6;margin:0">
  Si tienes preguntas sobre el trabajo realizado, comunícate con el taller antes de pasar a recoger.
</p>`
    return emailShell('linear-gradient(135deg,#14532d 0%,#166534 60%,#15803d 100%)', body, workshopName)
}

export function buildAppointmentReminderEmail(
    clientName: string,
    vehicleDesc: string,
    appointmentDate: Date,
    workshopName: string,
    workshopPhone: string | null
): string {
    const dateStr = appointmentDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    const timeStr = appointmentDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

    const phoneBlock = workshopPhone
        ? `<p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0">
             ¿Necesitas reprogramar? Llámanos al <a href="tel:${workshopPhone}" style="color:#60a5fa;text-decoration:none;font-weight:600">${workshopPhone}</a>
           </p>`
        : `<p style="color:#71717a;font-size:13px;line-height:1.6;margin:0">Si necesitas reprogramar, comunícate con el taller a la brevedad.</p>`

    const body = `
<div style="margin:0 0 6px">
  <div style="display:inline-block;background:#3b82f6;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">
    &#128337; Recordatorio de cita
  </div>
</div>
<h2 style="font-size:22px;font-weight:900;margin:0 0 8px;color:#fff;line-height:1.2">Tu cita es mañana</h2>
<p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 24px">
  Hola <strong style="color:#f4f4f5">${clientName}</strong>, te recordamos que tienes una cita programada para mañana.
</p>

<!-- Date/time card -->
<div style="background:#0a0a0a;border:2px solid #3b82f6;border-radius:12px;padding:20px 24px;text-align:center;margin:0 0 20px">
  <div style="color:#60a5fa;font-size:18px;font-weight:900;text-transform:capitalize;margin-bottom:4px">${dateStr}</div>
  <div style="color:#fff;font-size:36px;font-weight:900;letter-spacing:2px;line-height:1">${timeStr}</div>
</div>

${vehicleCard(vehicleDesc)}
${phoneBlock}`
    return emailShell('linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%)', body, workshopName)
}

// ── Subscription / billing templates ─────────────────────────

export function buildTrialWelcomeEmail(workshopName: string, trialDays: number): string {
    const body = `
<div style="display:inline-block;background:#f97316;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">
  Prueba gratuita activada
</div>
<h2 style="font-size:22px;font-weight:900;margin:0 0 8px;color:#fff">¡Bienvenido a MotoFix, ${workshopName}!</h2>
<p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 24px">
  Tu período de prueba de <strong style="color:#f97316">${trialDays} días</strong> ha comenzado.
  Explora todas las funcionalidades sin restricciones: gestión de clientes, taller, inventario, contabilidad y mucho más.
</p>
<div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px 20px;margin:0 0 24px">
  <div style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">¿Qué puedes hacer?</div>
  <div style="color:#d4d4d8;font-size:13px;line-height:2">&#9989; Gestión de clientes y vehículos<br>&#9989; Taller con seguimiento en tiempo real<br>&#9989; Inventario y proveedores<br>&#9989; Contabilidad y reportes<br>&#9989; Página web pública del taller</div>
</div>
${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/login`, 'Ir a mi taller')}`
    return emailShell('linear-gradient(135deg,#c2410c 0%,#ea580c 60%,#f97316 100%)', body, workshopName)
}

export function buildTrialExpiringEmail(workshopName: string, daysLeft: number): string {
    const urgent  = daysLeft <= 1
    const accent  = urgent ? '#f43f5e' : '#f97316'
    const days    = daysLeft === 0 ? 'vence hoy' : daysLeft === 1 ? 'vence mañana' : `vence en ${daysLeft} días`
    const gradient = urgent
        ? 'linear-gradient(135deg,#881337 0%,#be123c 60%,#f43f5e 100%)'
        : 'linear-gradient(135deg,#c2410c 0%,#ea580c 60%,#f97316 100%)'
    const body = `
<div style="background:${accent}18;border:1px solid ${accent}40;border-radius:10px;padding:12px 16px;margin-bottom:20px">
  <div style="color:${accent};font-size:13px;font-weight:700">&#9888; Tu prueba ${days}</div>
</div>
<h2 style="font-size:22px;font-weight:900;margin:0 0 8px;color:#fff">Tu período de prueba está por terminar</h2>
<p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 24px">
  Hola <strong style="color:#f4f4f5">${workshopName}</strong>, activa tu plan para seguir usando MotoFix sin interrupciones.
</p>
${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/login`, 'Activar mi plan ahora', accent)}`
    return emailShell(gradient, body, workshopName)
}

export function buildSubscriptionExpiringEmail(workshopName: string, daysLeft: number, endsAt: string): string {
    const dateStr = new Date(endsAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    const body = `
<h2 style="font-size:22px;font-weight:900;margin:0 0 8px;color:#fff">Tu suscripción vence pronto</h2>
<p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 24px">
  Hola <strong style="color:#f4f4f5">${workshopName}</strong>, tu suscripción vence el
  <strong style="color:#f97316">${dateStr}</strong> (en ${daysLeft} días). Renueva para no perder el acceso.
</p>
${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/login`, 'Renovar suscripción')}`
    return emailShell('linear-gradient(135deg,#c2410c 0%,#ea580c 60%,#f97316 100%)', body, workshopName)
}

export function buildSubscriptionActivatedEmail(workshopName: string, planName: string, endsAt: string): string {
    const dateStr = new Date(endsAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    const body = `
<div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:12px 16px;margin-bottom:20px">
  <div style="color:#4ade80;font-size:13px;font-weight:700">&#10003; Pago confirmado</div>
</div>
<h2 style="font-size:22px;font-weight:900;margin:0 0 8px;color:#fff">&#127881; ¡Tu plan está activo!</h2>
<p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 24px">
  Hola <strong style="color:#f4f4f5">${workshopName}</strong>, tu plan
  <strong style="color:#f97316">${planName}</strong> ha sido activado. Próxima renovación: <strong style="color:#f4f4f5">${dateStr}</strong>.
</p>
${ctaButton(`${process.env.NEXT_PUBLIC_APP_URL}/login`, 'Ir a mi taller', '#22c55e')}`
    return emailShell('linear-gradient(135deg,#14532d 0%,#166534 60%,#15803d 100%)', body, workshopName)
}
