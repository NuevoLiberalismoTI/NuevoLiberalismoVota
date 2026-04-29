'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🗳️</div>
            <span className="text-xl font-bold text-white">VotaApp</span>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
              Features
            </button>
            <button className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
              About
            </button>
            <a
              href="#inicio"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-6 py-32 sm:py-48 text-center">
          <div className="mb-8">
            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
              Tu plataforma de <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">votación</span> moderna
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Una aplicación segura, rápida y transparente para realizar votaciones en tiempo real.
              Emitir tu voto nunca fue tan fácil.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="#inicio"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105"
            >
              Comenzar Ahora
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 border-2 border-slate-500 text-white rounded-lg font-semibold hover:border-slate-400 transition"
            >
              Conocer más
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="p-4 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700">
              <div className="text-3xl font-bold text-blue-400">10K+</div>
              <div className="text-sm text-slate-400">Votaciones realizadas</div>
            </div>
            <div className="p-4 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700">
              <div className="text-3xl font-bold text-purple-400">99.9%</div>
              <div className="text-sm text-slate-400">Disponibilidad</div>
            </div>
            <div className="p-4 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700">
              <div className="text-3xl font-bold text-pink-400">24/7</div>
              <div className="text-sm text-slate-400">Soporte</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Características principales</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500 transition hover:bg-slate-800">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-3">Seguridad garantizada</h3>
              <p className="text-slate-400">
                Tus datos están protegidos con encriptación de última generación y cumplimos con los estándares internacionales.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500 transition hover:bg-slate-800">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Ultra rápido</h3>
              <p className="text-slate-400">
                Votaciones instantáneas con actualizaciones en tiempo real. Resultados precisos al instante.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-pink-500 transition hover:bg-slate-800">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-3">Transparente</h3>
              <p className="text-slate-400">
                Visualiza resultados en vivo con gráficos interactivos. Sin sorpresas, solo datos reales.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-green-500 transition hover:bg-slate-800">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-white mb-3">Responsive</h3>
              <p className="text-slate-400">
                Funciona perfectamente en celular, tablet y escritorio. Votación desde cualquier lugar.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-yellow-500 transition hover:bg-slate-800">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-white mb-3">Fácil de usar</h3>
              <p className="text-slate-400">
                Interfaz intuitiva que cualquiera puede usar. Sin complicaciones, máxima simplicidad.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500 transition hover:bg-slate-800">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-3">Escalable</h3>
              <p className="text-slate-400">
                Desde 10 hasta millones de votos. La plataforma crece contigo sin comprometer velocidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="inicio" className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">¿Listo para empezar?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Comienza tu primera votación en menos de 1 minuto. Es gratis y no requiere configuración.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition transform hover:scale-105">
                Crear votación
              </button>
              <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
                Contactar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">VotaApp</div>
              <p className="text-slate-400">La plataforma de votación del futuro</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Precios</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 flex justify-between items-center">
            <p className="text-slate-400">© 2024 VotaApp. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition">Twitter</a>
              <a href="#" className="text-slate-400 hover:text-white transition">GitHub</a>
              <a href="#" className="text-slate-400 hover:text-white transition">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Styles for Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
