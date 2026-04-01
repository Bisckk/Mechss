import Navbar from '@/components/home/Navbar'
import Hero from '@/components/home/Hero'
import Features from '@/components/home/Features'
import Pricing from '@/components/home/Pricing'
import Footer from '@/components/home/Footer'

export default function HomePage() {
  return (
    <main className="bg-zinc-950">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      {/* CTA strip */}
      <section className="bg-zinc-950 border-t border-zinc-900 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-5">
            ¿Listo para transformar{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              tu taller?
            </span>
          </h2>
          <p className="text-lg text-zinc-400 mb-10">
            Únete a más de 2.400 talleres que ya trabajan de forma más inteligente con MotoFix.
            Tus primeros 14 días son completamente gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
            >
              Prueba Gratis 14 Días
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold text-lg rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
