'use client';

// Selector de hora con listas (hora, minutos, AM/PM) en lugar de <input type="time">,
// que en Safari de Mac no se muestra o no reconoce la hora escrita.
// Recibe y entrega la hora en formato 24 h "HH:MM", igual que el input nativo,
// y llama a onChange con un evento sintético { target: { name, value } }.

const HORAS   = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function separar(value) {
  const m = /^(\d{1,2}):(\d{2})/.exec(value || '');
  if (!m) return { h: '', min: '', ampm: '' };
  const h24 = Number(m[1]);
  return {
    h:    String(h24 % 12 === 0 ? 12 : h24 % 12),
    min:  m[2],
    ampm: h24 < 12 ? 'AM' : 'PM',
  };
}

function unir({ h, min, ampm }) {
  if (!h || !min || !ampm) return '';
  let h24 = Number(h) % 12;
  if (ampm === 'PM') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${min}`;
}

export default function SelectorHora({ name, value, onChange, error, className = '' }) {
  const partes = separar(value);
  const minutos = partes.min && !MINUTOS.includes(partes.min) ? [...MINUTOS, partes.min].sort() : MINUTOS;

  const cambiar = (campo, v) => {
    const nuevo = { ...partes, [campo]: v };
    // Completar con valores por defecto para que la hora quede válida desde la primera selección
    if (campo === 'h') { nuevo.min = nuevo.min || '00'; nuevo.ampm = nuevo.ampm || 'AM'; }
    onChange({ target: { name, value: unir(nuevo) } });
  };

  const sel = `border ${error ? 'border-red-400' : 'border-gray-300'} rounded-lg px-3 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand transition`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select aria-label="Hora" value={partes.h} onChange={(e) => cambiar('h', e.target.value)} className={`${sel} flex-1`}>
        <option value="">Hora</option>
        {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-gray-400 font-bold">:</span>
      <select aria-label="Minutos" value={partes.min} onChange={(e) => cambiar('min', e.target.value)} className={`${sel} flex-1`}>
        <option value="">Min</option>
        {minutos.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select aria-label="AM o PM" value={partes.ampm} onChange={(e) => cambiar('ampm', e.target.value)} className={`${sel} flex-1`}>
        <option value="">--</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
