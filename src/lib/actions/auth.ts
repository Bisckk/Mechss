'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

type ActionResult = { ok: true; data: null } | { ok: false; error: string }

/**
 * Called from /change-password — updates the password and clears the
 * must_change_password flag in app_metadata atomically via the admin client.
 * The user's own session is used to verify their identity.
 */
export async function forcedChangePasswordAction(
  newPassword: string
): Promise<ActionResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sesión no válida. Inicia sesión de nuevo.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    app_metadata: { must_change_password: false },
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: null }
}

/**
 * Generates a Supabase auth recovery link using the admin client
 * and sends it via Nodemailer to bypass Supabase's default email service
 * and customize the template/SMTP.
 */
export async function sendPasswordResetEmailAction(email: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient()

    // 1. Generate the recovery link
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      }
    })

    if (linkError) {
      // Avoid leaking if user exists or not
      if (linkError.message.toLowerCase().includes('user not found')) {
        return { ok: true, data: null }
      }
      return { ok: false, error: linkError.message }
    }

    const { action_link } = linkData.properties

    // 2. We dynamically import nodemailer so it's not bundled everywhere
    const nodemailer = (await import('nodemailer')).default

    // 3. Configure the Nodemailer SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for port 465, false otherwise
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    })

    // 4. Send the HTML localized email
    const mailOptions = {
      from: `"MotoFix" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - MotoFix',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; padding: 30px; border-radius: 12px; border: 1px solid #27272a;">
          <h1 style="color: #f97316; margin-bottom: 20px; font-weight: 900; font-size: 28px;">Moto<span style="color: #ffffff;">Fix</span></h1>
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 10px;">Recuperación de Contraseña</h2>
          <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; font-size: 15px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. 
            Haz clic en el siguiente botón para crear una nueva contraseña. Si no realizaste esta solicitud, puedes ignorar este correo.
          </p>
          <a href="${action_link}" style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 24px; font-size: 14px;">
            Restablecer Contraseña
          </a>
          <p style="color: #71717a; font-size: 12px; margin-top: 30px; border-top: 1px solid #27272a; padding-top: 20px;">
            Enlace válido por 24 horas. Este es un sistema automático, por favor no respondas a este correo.
          </p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)

    return { ok: true, data: null }
  } catch (error: any) {
    console.error('Nodemailer Error:', error)
    return { ok: false, error: `Error SMTP: ${error.message || 'Desconocido'}` }
  }
}

