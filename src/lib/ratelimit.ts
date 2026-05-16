// In-memory sliding-window rate limiter — works within a single Node.js instance

type Window = { count: number; start: number }

const windows = new Map<string, Window>()

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number  // unix ms
}

export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now()
    const win = windows.get(key)

    if (!win || now - win.start >= windowMs) {
        windows.set(key, { count: 1, start: now })
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
    }

    const resetAt = win.start + windowMs
    if (win.count >= limit) {
        return { allowed: false, remaining: 0, resetAt }
    }

    win.count++
    return { allowed: true, remaining: limit - win.count, resetAt }
}

export function getClientIp(headers: { get(name: string): string | null }): string {
    return (
        headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        headers.get('x-real-ip') ??
        'unknown'
    )
}
