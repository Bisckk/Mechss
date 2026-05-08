import type { UserRole } from './supabase/types'

export function getRoleDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    superadmin:   '/superadmin',
    admin:        '/admin',
    receptionist: '/admin/taller',
    mechanic:     '/admin/taller',
  }
  return paths[role] ?? '/dashboard'
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Formato de moneda para Colombia (COP).
 * Ejemplo: $184.320
 */
export function formatCurrency(amount: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formato de fecha corta para Colombia.
 * Ejemplo: 31 mar 2026
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Formato de fecha y hora para Colombia.
 * Ejemplo: 31 mar 2026, 7:30 p.m.
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Nombres de meses en español (abreviados).
 */
export const MESES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const
