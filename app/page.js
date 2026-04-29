export default function Page() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <span className="inline-block bg-red-600 text-white text-sm font-semibold px-4 py-1 rounded-full uppercase tracking-wide">
            Nuevo Liberalismo
          </span>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Tu voto construye el futuro
        </h1>

        <p className="text-xl text-gray-600 mb-10">
          Participa en la plataforma oficial de votación del Nuevo Liberalismo.
          Tu voz importa.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
            Registrarme
          </button>
          <button className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold py-3 px-8 rounded-lg transition-colors">
            Ya tengo cuenta
          </button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-red-600">+50K</p>
            <p className="text-gray-500 mt-1">Votantes registrados</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">32</p>
            <p className="text-gray-500 mt-1">Departamentos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">100%</p>
            <p className="text-gray-500 mt-1">Seguro y transparente</p>
          </div>
        </div>
      </div>
    </main>
  )
}
