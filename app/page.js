'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, Users } from 'lucide-react';

export default function VotingPage() {
  const [selectedVote, setSelectedVote] = useState(null);
  const [voted, setVoted] = useState(false);
  const [voteConfirmed, setVoteConfirmed] = useState(false);

  const votingOptions = [
    {
      id: 1,
      name: 'María López García',
      position: 'Candidata a Gobernadora',
      department: 'Bogotá D.C.',
      votes: 12450,
      percentage: 42,
      description: 'Propuesta: Economía digital y emprendimiento',
      image: '👩‍💼'
    },
    {
      id: 2,
      name: 'Carlos Mendez Restrepo',
      position: 'Candidato a Gobernador',
      department: 'Antioquia',
      votes: 8320,
      percentage: 28,
      description: 'Propuesta: Desarrollo rural sostenible',
      image: '👨‍💼'
    },
    {
      id: 3,
      name: 'Sandra Morales Pérez',
      position: 'Candidata a Gobernadora',
      department: 'Valle del Cauca',
      votes: 7890,
      percentage: 26,
      description: 'Propuesta: Educación y transformación social',
      image: '👩‍💼'
    },
    {
      id: 4,
      name: 'Jorge Castillo Ruiz',
      position: 'Candidato a Gobernador',
      department: 'Nariño',
      votes: 1340,
      percentage: 4,
      description: 'Propuesta: Integración regional fronteriza',
      image: '👨‍💼'
    }
  ];

  const handleVote = (optionId) => {
    if (!voteConfirmed) {
      setSelectedVote(optionId);
      setVoted(true);
    }
  };

  const handleConfirmVote = () => {
    setVoteConfirmed(true);
  };

  const handleNewVote = () => {
    setSelectedVote(null);
    setVoted(false);
    setVoteConfirmed(false);
  };

  // Vista de votación completada
  if (voteConfirmed) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col">
        {/* Header */}
        <header className="w-full px-4 py-4 flex items-center justify-center border-b-2 border-red-600 bg-white shadow-sm">
          <span className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
            Nuevo Liberalismo - Sistema de Votación
          </span>
        </header>

        {/* Confirmation Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-600 rounded-full opacity-20 animate-pulse"></div>
                <CheckCircle size={80} className="text-red-600 relative z-10" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              ¡Voto Registrado!
            </h1>

            <p className="text-gray-600 mb-2">
              Tu voto ha sido confirmado exitosamente
            </p>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Tu selección:</p>
              <p className="text-2xl font-bold text-red-600">
                {votingOptions.find(opt => opt.id === selectedVote)?.name}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {votingOptions.find(opt => opt.id === selectedVote)?.position}
              </p>
            </div>

            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Tu voto es confidencial y ha sido registrado en nuestro sistema seguro. 
              Gracias por participar en la democracia del Nuevo Liberalismo.
            </p>

            <button
              onClick={handleNewVote}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 px-6 rounded-xl transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-4 px-4 border-t border-gray-200">
          © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
        </footer>
      </main>
    );
  }

  // Vista de confirmación de voto
  if (voted && selectedVote) {
    const selected = votingOptions.find(opt => opt.id === selectedVote);
    
    return (
      <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col">
        {/* Header */}
        <header className="w-full px-4 py-4 flex items-center justify-center border-b-2 border-red-600 bg-white shadow-sm">
          <span className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
            Nuevo Liberalismo - Sistema de Votación
          </span>
        </header>

        {/* Confirmation Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="max-w-md w-full">
            <div className="mb-8">
              <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
              <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                Confirma tu voto
              </h1>
              <p className="text-gray-600 text-center">
                Revisa tu selección antes de confirmar
              </p>
            </div>

            {/* Candidate Card */}
            <div className="bg-white border-2 border-red-200 rounded-2xl p-6 mb-6 shadow-lg">
              <div className="text-6xl mb-4 text-center">{selected.image}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
                {selected.name}
              </h2>
              <p className="text-red-600 font-semibold text-center mb-1">
                {selected.position}
              </p>
              <p className="text-sm text-gray-500 text-center mb-4">
                {selected.department}
              </p>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-2">Propuesta:</p>
                <p className="text-gray-900 font-medium">{selected.description}</p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Este voto no podrá ser modificado una vez confirmado. Por favor verifica tu selección.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVoted(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleConfirmVote}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Confirmar Voto
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-4 px-4 border-t border-gray-200">
          © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
        </footer>
      </main>
    );
  }

  // Vista principal de votación
  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col">
      {/* Header */}
      <header className="w-full px-4 py-4 flex items-center justify-center border-b-2 border-red-600 bg-white shadow-sm">
        <span className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
          Nuevo Liberalismo - Sistema de Votación
        </span>
      </header>

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight">
          Elige tu Candidato
        </h1>
        <p className="text-red-100 text-lg max-w-xl mx-auto">
          Tu participación es fundamental para construir el futuro del Nuevo Liberalismo
        </p>
      </section>

      {/* Voting Info */}
      <section className="w-full px-4 py-8 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <Clock size={24} className="text-red-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600">Votación</p>
            <p className="text-sm font-bold text-gray-900">En curso</p>
          </div>
          <div className="text-center">
            <Users size={24} className="text-red-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600">Participantes</p>
            <p className="text-sm font-bold text-gray-900">29,000+</p>
          </div>
          <div className="text-center">
            <CheckCircle size={24} className="text-red-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600">Candidatos</p>
            <p className="text-sm font-bold text-gray-900">4</p>
          </div>
          <div className="text-center">
            <AlertCircle size={24} className="text-red-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600">Transparencia</p>
            <p className="text-sm font-bold text-gray-900">100%</p>
          </div>
        </div>
      </section>

      {/* Candidates Grid */}
      <section className="flex-1 w-full max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {votingOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleVote(option.id)}
              className={`cursor-pointer rounded-2xl overflow-hidden transition-all transform hover:scale-105 ${
                selectedVote === option.id
                  ? 'ring-4 ring-red-600 bg-red-50 shadow-xl scale-105'
                  : 'bg-white border-2 border-gray-200 hover:border-red-400 shadow-md'
              }`}
            >
              {/* Candidate Card */}
              <div className="p-6">
                {/* Avatar */}
                <div className="text-7xl mb-4 text-center">{option.image}</div>

                {/* Name and Position */}
                <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">
                  {option.name}
                </h3>
                <p className="text-red-600 font-semibold text-sm text-center mb-1">
                  {option.position}
                </p>
                <p className="text-xs text-gray-500 text-center mb-4">
                  {option.department}
                </p>

                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">{option.description}</p>
                </div>

                {/* Vote Count */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-600">Votos recibidos</span>
                    <span className="text-lg font-bold text-red-600">{option.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-red-600 h-full transition-all rounded-full"
                      style={{ width: `${option.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{option.votes.toLocaleString()} votos</p>
                </div>

                {/* Vote Button */}
                <button
                  className={`w-full font-bold py-3 px-4 rounded-xl transition-all ${
                    selectedVote === option.id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  {selectedVote === option.id ? '✓ Seleccionado' : 'Seleccionar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Section */}
      {selectedVote && (
        <section className="w-full bg-white border-t-2 border-red-600 px-4 py-6 sticky bottom-0">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setVoted(true)}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors shadow-lg"
            >
              Continuar con mi voto
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4 px-4 bg-white border-t border-gray-200">
        © {new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados
      </footer>
    </main>
  );
}