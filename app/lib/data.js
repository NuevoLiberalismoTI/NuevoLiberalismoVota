export const USERS = [
  { cedula: '1234567890', password: '1234567890', nombre: 'Juan David García', rol: 'usuario' },
  { cedula: 'admin',      password: 'admin2025',  nombre: 'Administrador NL',  rol: 'admin'   },
];

export const DEPARTAMENTOS_CON_CODIGO = [
  { nombre: 'Amazonas',                  codigo: 'AMA' },
  { nombre: 'Antioquia',                 codigo: 'ANT' },
  { nombre: 'Arauca',                    codigo: 'ARA' },
  { nombre: 'Atlántico',                 codigo: 'ATL' },
  { nombre: 'Bogotá D.C.',               codigo: 'BOG' },
  { nombre: 'Bolívar',                   codigo: 'BOL' },
  { nombre: 'Boyacá',                    codigo: 'BOY' },
  { nombre: 'Caldas',                    codigo: 'CAL' },
  { nombre: 'Caquetá',                   codigo: 'CAQ' },
  { nombre: 'Casanare',                  codigo: 'CAS' },
  { nombre: 'Cauca',                     codigo: 'CAU' },
  { nombre: 'Cesar',                     codigo: 'CES' },
  { nombre: 'Chocó',                     codigo: 'CHO' },
  { nombre: 'Córdoba',                   codigo: 'COR' },
  { nombre: 'Cundinamarca',              codigo: 'CUN' },
  { nombre: 'Guainía',                   codigo: 'GNA' },
  { nombre: 'Guaviare',                  codigo: 'GVR' },
  { nombre: 'Huila',                     codigo: 'HUI' },
  { nombre: 'La Guajira',               codigo: 'GUJ' },
  { nombre: 'Magdalena',                 codigo: 'MAG' },
  { nombre: 'Meta',                      codigo: 'MET' },
  { nombre: 'Nariño',                    codigo: 'NAR' },
  { nombre: 'Norte de Santander',        codigo: 'NSA' },
  { nombre: 'Putumayo',                  codigo: 'PUT' },
  { nombre: 'Quindío',                   codigo: 'QUI' },
  { nombre: 'Risaralda',                 codigo: 'RIS' },
  { nombre: 'San Andrés y Providencia',  codigo: 'SAN' },
  { nombre: 'Santander',                 codigo: 'STD' },
  { nombre: 'Sucre',                     codigo: 'SUC' },
  { nombre: 'Tolima',                    codigo: 'TOL' },
  { nombre: 'Valle del Cauca',           codigo: 'VAL' },
  { nombre: 'Vaupés',                    codigo: 'VAP' },
  { nombre: 'Vichada',                   codigo: 'VIC' },
];

export const TIPOS_ASAMBLEA = ['TERRITORIAL', 'NACIONAL', 'OTRO'];
export const COLECTIVOS     = ['GENERAL', 'JÓVENES', 'MUJERES'];

export const TIPO_CODIGO   = { TERRITORIAL: 'T', NACIONAL: 'N', OTRO: 'O' };
export const COLECT_CODIGO = { GENERAL: 'G', 'JÓVENES': 'J', MUJERES: 'M' };

export function generarConsecutivo({ tipo, colectivo, departamento, zona, fecha }) {
  const d     = new Date(fecha || Date.now());
  const mm    = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy  = d.getFullYear();
  const dept  = DEPARTAMENTOS_CON_CODIGO.find((x) => x.nombre === departamento)?.codigo || 'GEN';
  const zon   = (zona || 'Z1').toUpperCase().replace(/\s+/g, '').slice(0, 6);
  const t     = TIPO_CODIGO[tipo]   || 'O';
  const c     = COLECT_CODIGO[colectivo] || 'G';
  return `${t}${c}-${dept}-${zon}-${mm}${yyyy}`;
}

// Sesiones por defecto (se sobrescriben con las de localStorage)
export const SESIONES_DEFAULT = [
  {
    id: 'TG-ANT-NORTE-042025',
    nombre: 'Asamblea Territorial General Antioquia Norte',
    tipo: 'TERRITORIAL', colectivo: 'GENERAL',
    departamento: 'Antioquia', zona: 'NORTE',
    fecha: '2025-05-15', hora: '9:00 AM',
    lugar: 'Bogotá D.C. — Centro de Convenciones',
    estado: 'en_curso',
    preguntaActivaId: null,
    codigoAsistencia: 'NL2025',
    preguntas: [
      { id: 1, tipo: 'sino',       estado: 'pendiente', texto: '¿Aprueba la nueva agenda programática del partido 2025-2026?' },
      { id: 2, tipo: 'candidatos', estado: 'pendiente', texto: '¿A cuál candidato apoya para la presidencia del Directorio Nacional?', opciones: ['María López García','Carlos Mendez Restrepo','Sandra Morales Pérez'] },
      { id: 3, tipo: 'sino',       estado: 'pendiente', texto: '¿Está de acuerdo con la modificación de estatutos del artículo 12?' },
      { id: 4, tipo: 'candidatos', estado: 'pendiente', texto: '¿Qué candidato apoya para la Secretaría General?', opciones: ['Jorge Castillo Ruiz','Ana Fernández Torres'] },
    ],
  },
  {
    id: 'TJ-VAL-SUR-052025',
    nombre: 'Asamblea Territorial Jóvenes Valle del Cauca Sur',
    tipo: 'TERRITORIAL', colectivo: 'JÓVENES',
    departamento: 'Valle del Cauca', zona: 'SUR',
    fecha: '2025-05-22', hora: '10:00 AM',
    lugar: 'Medellín — Palacio de Exposiciones',
    estado: 'proxima',
    preguntaActivaId: null,
    codigoAsistencia: 'JOV2025',
    preguntas: [],
  },
  {
    id: 'NG-BOG-Z1-032025',
    nombre: 'Asamblea Nacional General Bogotá Z1',
    tipo: 'NACIONAL', colectivo: 'GENERAL',
    departamento: 'Bogotá D.C.', zona: 'Z1',
    fecha: '2025-04-01', hora: '8:00 AM',
    lugar: 'Cali — Centro Cultural',
    estado: 'finalizada',
    preguntaActivaId: null,
    codigoAsistencia: 'NAC2025',
    preguntas: [],
  },
];
