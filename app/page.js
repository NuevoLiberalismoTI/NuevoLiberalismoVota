export default function Page() {
  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="w-full px-4 py-4 flex items-center justify-center border-b border-gray-100">
        <span className="bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
          Nuevo Liberalismo
        </span>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-xl w-full">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Tu voto construye <br className="hidden sm:block" />
            <span className="text-red-600">el futuro</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 mb-10 max-w-md mx-auto">
            Únete a la plataforma oficial del Nuevo Liberalismo y participa activamente en la democracia de Colombia.
          </p>

          {/* Botón principal */}
          <a
            href="#registro"
            className="block w-full sm:w-auto sm:inline-block bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg font-bold py-4 px-10 rounded-xl shadow-lg transition-colors"
          >
            Registrarme como militante
          </a>

          <p className="mt-4 text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <a href="#login" className="text-red-600 font-medium underline">
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full bg-gray-50 border-t border-gray-100 py-10 px-4">
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">+50K</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Militantes</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">32</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Departamentos</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">100%</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Transparente</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 px-4">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>

    </main>
  )
}
