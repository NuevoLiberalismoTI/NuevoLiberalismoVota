export const USERS = [
  { cedula: '1234567890', password: '1234567890', nombre: 'Juan David García' },
];

export const SESIONES = [
  {
    id: '1',
    nombre: 'Asamblea Nacional Ordinaria 2025',
    fecha: '15 de mayo de 2025',
    hora: '9:00 AM',
    lugar: 'Bogotá D.C. — Centro de Convenciones',
    estado: 'en_curso',
    codigoAsistencia: 'NL2025',
    preguntas: [
      {
        id: 1,
        tipo: 'sino',
        texto: '¿Aprueba usted la nueva agenda programática del partido para el periodo 2025-2026?',
      },
      {
        id: 2,
        tipo: 'candidatos',
        texto: '¿A cuál candidato apoya para la presidencia del Directorio Nacional?',
        opciones: [
          'María López García',
          'Carlos Mendez Restrepo',
          'Sandra Morales Pérez',
        ],
      },
      {
        id: 3,
        tipo: 'sino',
        texto: '¿Está de acuerdo con la modificación de estatutos propuesta en el artículo 12?',
      },
      {
        id: 4,
        tipo: 'candidatos',
        texto: '¿Qué candidato apoya para la Secretaría General?',
        opciones: [
          'Jorge Castillo Ruiz',
          'Ana Fernández Torres',
        ],
      },
    ],
  },
  {
    id: '2',
    nombre: 'Asamblea Regional Antioquia',
    fecha: '22 de mayo de 2025',
    hora: '10:00 AM',
    lugar: 'Medellín — Palacio de Exposiciones',
    estado: 'proxima',
    codigoAsistencia: 'ANT2025',
    preguntas: [],
  },
  {
    id: '3',
    nombre: 'Asamblea Regional Valle del Cauca',
    fecha: '1 de abril de 2025',
    hora: '8:00 AM',
    lugar: 'Cali — Centro Cultural',
    estado: 'finalizada',
    codigoAsistencia: 'VAL2025',
    preguntas: [],
  },
];
