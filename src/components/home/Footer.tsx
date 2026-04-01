import Link from 'next/link'

const footerLinks = {
  Producto: [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Precios', href: '#pricing' },
    { label: 'Novedades', href: '/changelog' },
    { label: 'Hoja de Ruta', href: '/roadmap' },
  ],
  Empresa: [
    { label: 'Acerca de', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Trabaja con nosotros', href: '/careers' },
    { label: 'Contacto', href: '/contact' },
  ],
  Legal: [
    { label: 'Política de Privacidad', href: '/privacy' },
    { label: 'Términos de Servicio', href: '/terms' },
    { label: 'Política de Cookies', href: '/cookies' },
    { label: 'Habeas Data', href: '/habeas-data' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Moto<span className="text-orange-500">Fix</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-[220px]">
              La plataforma SaaS completa para talleres de motos y vehículos en Colombia.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">{group}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-900">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} MotoFix SaaS. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-zinc-600">Todos los sistemas operativos</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
