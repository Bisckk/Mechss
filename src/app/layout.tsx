import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'MotoFix — Gestión de Talleres SaaS',
    template: '%s | MotoFix',
  },
  description:
    'La plataforma SaaS todo-en-uno para talleres de motos y vehículos. Citas, seguimiento de reparaciones, inventario, contabilidad y constructor de landing pages.',
  keywords: ['gestión de talleres', 'reparación de motos', 'reparación de vehículos', 'SaaS', 'seguimiento de reparaciones', 'talleres Colombia'],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    title: 'MotoFix — Gestión de Talleres SaaS',
    description: 'Administra tu taller con confianza.',
    siteName: 'MotoFix',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
