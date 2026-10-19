// Regla: toda persona invitada a una asamblea que ya tenga usuario creado debe quedar preinscrita.
// Se usa al invitar, al sincronizar postulantes, al crear usuario / iniciar sesión y desde el panel.

export const normCedula = (c) => {
  if (c == null) return null;
  const s = String(c).trim().replace(/[^0-9a-zA-Z]/g, '');
  if (!s) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? s.toLowerCase() : String(n);
};

async function inscribir(supabase, asambleaId, cedula) {
  const { data, error } = await supabase.rpc('inscribir_usuario', { p_asamblea_id: asambleaId, p_cedula: cedula });
  if (error) return { ok: false, error: error.message };
  if (data && data.ok === false) return { ok: false, error: data.error || 'rechazado' };
  return { ok: true };
}

// Preinscribe en una asamblea a todos sus invitados que ya tienen usuario.
// Devuelve cuántos se inscribieron y los motivos de rechazo agrupados (para mostrarlos en el panel).
export async function preinscribirInvitadosConUsuario(supabase, asambleaId) {
  const { data: asm } = await supabase.from('asambleas').select('estado').eq('id', asambleaId).maybeSingle();
  if (!asm) return { ok: false, error: 'Sesión no encontrada' };
  if (asm.estado === 'finalizada') return { ok: true, inscritos: 0, pendientes: 0, errores: {} };

  const [{ data: invit }, { data: insc }] = await Promise.all([
    supabase.from('invitaciones_enviadas').select('cedula').eq('sesion_id', asambleaId).not('cedula', 'is', null),
    supabase.from('inscripciones').select('usuario_cedula').eq('asamblea_id', asambleaId),
  ]);

  const yaInscritos = new Set((insc || []).map((i) => normCedula(i.usuario_cedula)).filter(Boolean));
  const invitadas   = [...new Set((invit || []).map((i) => String(i.cedula).trim()).filter(Boolean))]
    .filter((c) => !yaInscritos.has(normCedula(c)));
  if (invitadas.length === 0) return { ok: true, inscritos: 0, pendientes: 0, errores: {} };

  // Buscar usuarios por la cédula tal como fue invitada y por su forma normalizada
  const variantes = [...new Set(invitadas.flatMap((c) => [c, normCedula(c)]).filter(Boolean))];
  const usuarios  = [];
  for (let i = 0; i < variantes.length; i += 300) {
    const { data } = await supabase.from('usuarios').select('cedula').in('cedula', variantes.slice(i, i + 300));
    usuarios.push(...(data || []));
  }

  const porInscribir = [...new Map(
    usuarios
      .filter((u) => !yaInscritos.has(normCedula(u.cedula)))
      .map((u) => [normCedula(u.cedula), String(u.cedula)])
  ).values()];

  let inscritos = 0;
  const errores = {};
  for (let i = 0; i < porInscribir.length; i += 10) {
    const res = await Promise.all(porInscribir.slice(i, i + 10).map((c) => inscribir(supabase, asambleaId, c)));
    res.forEach((r) => {
      if (r.ok) inscritos++;
      else errores[r.error] = (errores[r.error] || 0) + 1;
    });
  }

  if (Object.keys(errores).length) console.error(`[preinscripcion] ${asambleaId}:`, errores);
  return { ok: true, inscritos, pendientes: porInscribir.length - inscritos, errores };
}

// Preinscribe a un usuario en todas las asambleas activas a las que fue invitado.
export async function preinscribirUsuarioEnInvitaciones(supabase, cedula) {
  const objetivo = normCedula(cedula);
  if (!objetivo) return { ok: false, inscritos: 0 };

  const variantes = [...new Set([String(cedula).trim(), objetivo])];
  const { data: invit } = await supabase
    .from('invitaciones_enviadas')
    .select('sesion_id, cedula')
    .in('cedula', variantes);

  const sesionIds = [...new Set((invit || []).map((i) => i.sesion_id).filter(Boolean))];
  if (sesionIds.length === 0) return { ok: true, inscritos: 0 };

  const [{ data: asms }, { data: insc }] = await Promise.all([
    supabase.from('asambleas').select('id, estado, inscripciones_cerradas').in('id', sesionIds),
    supabase.from('inscripciones').select('asamblea_id, usuario_cedula').in('asamblea_id', sesionIds),
  ]);
  const yaEn = new Set((insc || []).filter((i) => normCedula(i.usuario_cedula) === objetivo).map((i) => i.asamblea_id));

  let inscritos = 0;
  for (const a of (asms || [])) {
    // Lado del usuario: respeta el cierre de inscripciones (el panel admin sí puede forzarlas)
    if (a.estado === 'finalizada' || a.inscripciones_cerradas || yaEn.has(a.id)) continue;
    const r = await inscribir(supabase, a.id, cedula);
    if (r.ok) inscritos++;
    else console.error(`[preinscripcion] ${cedula} en ${a.id}:`, r.error);
  }
  return { ok: true, inscritos };
}
