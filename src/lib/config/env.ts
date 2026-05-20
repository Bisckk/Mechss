// Punto único de acceso a variables de entorno.
// Ningún módulo de negocio importa process.env directamente.

function required(key: string): string {
    const value = process.env[key]
    if (!value) throw new Error(`Variable de entorno requerida no definida: ${key}`)
    return value
}

function optional(key: string): string | undefined {
    return process.env[key] || undefined
}

// ── Supabase ────────────────────────────────────────────────

export const supabaseEnv = {
    url:           required('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey:       required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
} as const

// ── WhatsApp Business Cloud API ─────────────────────────────

export const whatsappEnv = {
    accessToken:   optional('WHATSAPP_ACCESS_TOKEN'),
    phoneNumberId: optional('WHATSAPP_PHONE_NUMBER_ID'),
    wabaId:        optional('WHATSAPP_WABA_ID'),
    verifyToken:   optional('WHATSAPP_VERIFY_TOKEN'),
    appSecret:     optional('WHATSAPP_APP_SECRET'),
} as const

// ── Wompi ───────────────────────────────────────────────────

export const wompiEnv = {
    publicKey:       optional('WOMPI_PUBLIC_KEY'),
    privateKey:      optional('WOMPI_PRIVATE_KEY'),
    eventsSecret:    optional('WOMPI_EVENTS_SECRET'),
    integritySecret: optional('WOMPI_INTEGRITY_SECRET'),
} as const

// ── PayU ────────────────────────────────────────────────────

export const payuEnv = {
    merchantId: optional('PAYU_MERCHANT_ID'),
    apiKey:     optional('PAYU_API_KEY'),
    apiLogin:   optional('PAYU_API_LOGIN'),
    accountId:  optional('PAYU_ACCOUNT_ID'),
    testMode:   process.env['PAYU_TEST_MODE'] === '1',
} as const

// ── App ─────────────────────────────────────────────────────

export const appEnv = {
    baseUrl:       required('NEXT_PUBLIC_APP_URL'),
    vapidPublic:   optional('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
    vapidPrivate:  optional('VAPID_PRIVATE_KEY'),
    vapidEmail:    optional('VAPID_EMAIL'),
} as const
