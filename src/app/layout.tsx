import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MotoFix',
  },
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
  maximumScale: 1,
  themeColor: '#f97316',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        {/* PWA apple touch icon */}
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        {/* Service Worker registration */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(reg => console.log('[SW] Registered:', reg.scope))
                .catch(err => console.error('[SW] Registration failed:', err));
            });
          }
        `}</Script>
      </body>
    </html>
  )
}
