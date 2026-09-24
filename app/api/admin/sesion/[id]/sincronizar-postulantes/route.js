import { requireSessionAccess } from '../../../../../lib/session';
import { createServerClient } from '../../../../../lib/supabase-server';

const API_TOKEN = process.env.MILITANTES_API_TOKEN || '7TvcetUYWs0zuLMy5bX4Fx0cfYvrg2WCfbMpIOWVhCFwOQXB2WfMyWBB3kqSKIMo';
const BASE_URL  = 'https://nuevoliberalismo.org/wp-json/nl/v1/formularios/postulaciones';

function detectarForm(colectivoNombre = '') {
  const n = colectivoNombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  if (n.includes('JOVEN')) return 77;
  if (n.includes('MUJER')) return 76;
  return null;
}

async function fetchPostulaciones(formId, departamento) {
  const todos = [];
  let page = 1;
  const perPage = 500;

  while (true) {
    const url = new URL(BASE_URL);
    url.searchParams.set('token',    API_TOKEN);
    url.searchParams.set('form',     String(formId));
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page',     String(page));
    if (departamento) url.searchParams.set('departamento', departamento);

    const res  = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`Error al consultar postulaciones: ${res.status}`);
    const json = await res.json();

    todos.push(...(json.data || []));

    if (todos.length >= json.total || (json.data || []).length < perPage) break;
    page++;
  }

  return todos;
}

export async function POST(request, { params }) {
  const { id } = await params;
  const sesionId = decodeURIComponent(id);
  const supabase = createServerClient();

  const session = await requireSessionAccess(sesionId, supabase);
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  // Verificar que la sesión sea modo_rapido y tenga colectivo
  const { data: asm } = await supabase
    .from('asambleas')
    .select('id, modo_rapido, departamento, colectivos(nombre)')
    .eq('id', sesionId)
    .maybeSingle();

  if (!asm) return Response.json({ ok: false, error: 'Sesión no encontrada' }, { status: 404 });
  if (!asm.modo_rapido) return Response.json({ ok: false, error: 'Solo disponible para sesiones en modo rápido' }, { status: 400 });

  const colectivoNombre = asm.colectivos?.nombre || '';
  const formId = detectarForm(colectivoNombre);

  if (!formId) {
    return Response.json({
      ok:    false,
      error: `El colectivo "${colectivoNombre}" no corresponde a Jóvenes (77) ni Mujeres (76)`,
    }, { status: 400 });
  }

  // Traer postulaciones del endpoint externo
  let postulaciones;
  try {
    postulaciones = await fetchPostulaciones(formId, asm.departamento);
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 502 });
  }

  // La API externa hace LIKE '%departamento%', filtrar exacto para evitar que
  // "Santander" traiga también "Norte de Santander"
  const normStr = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
  const targetDep = normStr(asm.departamento);
  postulaciones = postulaciones.filter((p) => normStr(p.departamento) === targetDep);

  if (!postulaciones.length) {
    return Response.json({ ok: true, insertados: 0, mensaje: 'No se encontraron postulantes para este departamento.' });
  }

  // Mapear a filas de invitaciones_enviadas
  const filas = postulaciones
    .filter((p) => p.numero_documento)
    .map((p) => ({
      sesion_id:  sesionId,
      cedula:     String(p.numero_documento).trim(),
      nombre:     `${p.primer_nombre || ''} ${p.primer_apellido || ''}`.trim(),
      email:      p.email || null,
      telefono:   p.celular || null,
      enviado_en: new Date().toISOString(),
    }));

  // Upsert para evitar duplicados (sesion_id + cedula)
  const { error: upsertError } = await supabase
    .from('invitaciones_enviadas')
    .upsert(filas, { onConflict: 'sesion_id,cedula', ignoreDuplicates: false });

  if (upsertError) {
    // Si no hay unique constraint, intentar insert ignorando duplicados uno a uno
    let insertados = 0;
    for (const fila of filas) {
      const { error: e } = await supabase
        .from('invitaciones_enviadas')
        .insert([fila]);
      if (!e) insertados++;
    }
    return Response.json({ ok: true, insertados, total: filas.length });
  }

  return Response.json({ ok: true, insertados: filas.length, total: filas.length });
}
