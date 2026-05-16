// Structured logger — Sentry-ready. Replace console calls with captureException/captureMessage in production.

type Level = 'info' | 'warn' | 'error'

function log(level: Level, message: string, ctx?: Record<string, unknown>): void {
    const entry = { level, message, ts: new Date().toISOString(), ...ctx }
    if (level === 'error') {
        console.error(JSON.stringify(entry))
        // TODO: Sentry.captureException(ctx?.error ?? new Error(message), { extra: entry })
    } else if (level === 'warn') {
        console.warn(JSON.stringify(entry))
    } else {
        console.log(JSON.stringify(entry))
    }
}

export const logger = {
    info:  (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
    warn:  (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
    error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
}
