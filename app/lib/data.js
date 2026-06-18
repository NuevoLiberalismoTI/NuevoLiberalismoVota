export const USERS = [
  { cedula: '1234567890', password: '1234567890', nombre: 'Juan David García', rol: 'usuario' },
  { cedula: 'admin',      password: 'admin2025',  nombre: 'Administrador NL',  rol: 'admin'   },
];

export const DEPARTAMENTOS_CON_CODIGO = [
  { nombre: 'Antioquia',                codigo: 'ANT', divipol:  5 },
  { nombre: 'Atlántico',                codigo: 'ATL', divipol:  8 },
  { nombre: 'Bogotá D.C.',              codigo: 'BOG', divipol: 11 },
  { nombre: 'Bolívar',                  codigo: 'BOL', divipol: 13 },
  { nombre: 'Boyacá',                   codigo: 'BOY', divipol: 15 },
  { nombre: 'Caldas',                   codigo: 'CAL', divipol: 17 },
  { nombre: 'Caquetá',                  codigo: 'CAQ', divipol: 18 },
  { nombre: 'Cauca',                    codigo: 'CAU', divipol: 19 },
  { nombre: 'Cesar',                    codigo: 'CES', divipol: 20 },
  { nombre: 'Córdoba',                  codigo: 'COR', divipol: 23 },
  { nombre: 'Cundinamarca',             codigo: 'CUN', divipol: 25 },
  { nombre: 'Chocó',                    codigo: 'CHO', divipol: 27 },
  { nombre: 'Huila',                    codigo: 'HUI', divipol: 41 },
  { nombre: 'La Guajira',               codigo: 'GUJ', divipol: 44 },
  { nombre: 'Magdalena',                codigo: 'MAG', divipol: 47 },
  { nombre: 'Meta',                     codigo: 'MET', divipol: 50 },
  { nombre: 'Nariño',                   codigo: 'NAR', divipol: 52 },
  { nombre: 'Norte de Santander',       codigo: 'NSA', divipol: 54 },
  { nombre: 'Quindío',                  codigo: 'QUI', divipol: 63 },
  { nombre: 'Risaralda',                codigo: 'RIS', divipol: 66 },
  { nombre: 'Santander',                codigo: 'STD', divipol: 68 },
  { nombre: 'Sucre',                    codigo: 'SUC', divipol: 70 },
  { nombre: 'Tolima',                   codigo: 'TOL', divipol: 73 },
  { nombre: 'Valle del Cauca',          codigo: 'VAL', divipol: 76 },
  { nombre: 'Arauca',                   codigo: 'ARA', divipol: 81 },
  { nombre: 'Casanare',                 codigo: 'CAS', divipol: 85 },
  { nombre: 'Putumayo',                 codigo: 'PUT', divipol: 86 },
  { nombre: 'San Andrés y Providencia', codigo: 'SAN', divipol: 88 },
  { nombre: 'Amazonas',                 codigo: 'AMA', divipol: 91 },
  { nombre: 'Guainía',                  codigo: 'GNA', divipol: 94 },
  { nombre: 'Guaviare',                 codigo: 'GVR', divipol: 95 },
  { nombre: 'Vaupés',                   codigo: 'VAP', divipol: 97 },
  { nombre: 'Vichada',                  codigo: 'VIC', divipol: 99 },
];

// Obtiene el nombre del departamento a partir del código DIVIPOL de la API
export function nombreDeptPorDivipol(divipol) {
  const codigo = Number(divipol);
  return DEPARTAMENTOS_CON_CODIGO.find((d) => d.divipol === codigo)?.nombre || null;
}

// Lista de nombres para selects (misma fuente que DEPARTAMENTOS_CON_CODIGO)
export const DEPARTAMENTOS = DEPARTAMENTOS_CON_CODIGO.map((d) => d.nombre);

// Bogotá D.C. es departamento y municipio al mismo tiempo
export const BOGOTA = 'Bogotá D.C.';

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
