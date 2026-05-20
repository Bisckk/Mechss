export interface RetryOptions {
    maxAttempts?: number
    initialDelayMs?: number
    backoff?: boolean
    onRetry?: (attempt: number, error: unknown) => void
}

// Espera exponencial: 500ms, 1000ms, 2000ms...
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const { maxAttempts = 3, initialDelayMs = 500, backoff = true, onRetry } = options
    let lastError: unknown

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn()
        } catch (err) {
            lastError = err
            if (attempt === maxAttempts) break
            onRetry?.(attempt, err)
            const wait = backoff ? initialDelayMs * 2 ** (attempt - 1) : initialDelayMs
            await delay(wait)
        }
    }

    throw lastError
}

// Para fire-and-forget con logging, sin bloquear el flujo principal
export function withRetryBackground(
    fn: () => Promise<unknown>,
    options?: RetryOptions
): void {
    withRetry(fn, options).catch(err => {
        console.error('[retry] Falló tras todos los intentos:', err)
    })
}
