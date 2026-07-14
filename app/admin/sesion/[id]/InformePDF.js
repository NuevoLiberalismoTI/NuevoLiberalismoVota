'use client';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const LOGO_URL = 'https://nuevoliberalismo.org/wp-content/uploads/2026/02/logo_web_2024.png';

const BRAND = '#C20A00';
const GRAY  = '#6b7280';
const LIGHT = '#f4f4f5';
const DARK  = '#111827';
const GREEN = '#15803d';
const RED   = '#b91c1c';

const s = StyleSheet.create({
  page:         { fontFamily: 'Helvetica', fontSize: 10, color: DARK },
  header:       { backgroundColor: BRAND, paddingVertical: 28, paddingHorizontal: 40 },
  headerParty:  { color: '#ffcccc', fontSize: 8, marginBottom: 6 },
  headerTitle:  { color: '#ffffff', fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  headerDoc:    { color: '#ffb3b3', fontSize: 9 },
  body:         { paddingHorizontal: 40, paddingTop: 24, paddingBottom: 70 },
  label:        { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GRAY, marginTop: 18, marginBottom: 8 },
  // Info card
  infoCard:     { backgroundColor: LIGHT, borderRadius: 6, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 4 },
  infoRow:      { flexDirection: 'row', marginBottom: 6 },
  infoKey:      { width: 110, fontSize: 8.5, color: GRAY },
  infoVal:      { flex: 1, fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  // Stats
  statsRow:     { flexDirection: 'row', marginBottom: 8 },
  statBox:      { flex: 1, backgroundColor: LIGHT, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 8, marginRight: 6, alignItems: 'center' },
  statBoxLast:  { flex: 1, backgroundColor: LIGHT, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  statNum:      { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 3 },
  statKey:      { fontSize: 7, color: GRAY },
  // Quorum bar
  quorumRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  quorumLabel:  { fontSize: 8, color: GRAY },
  quorumStatus: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  barBg:        { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 2 },
  barFill:      { height: 8, borderRadius: 4 },
  // Question card
  qCard:        { borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  qNum:         { fontSize: 7.5, color: GRAY, marginBottom: 4 },
  qText:        { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 4, lineHeight: 1.4 },
  qType:        { fontSize: 8, color: GRAY, marginBottom: 12 },
  divLine:      { borderBottomWidth: 1, borderBottomColor: '#f3f4f6', marginBottom: 10 },
  // Option rows
  optRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  optName:      { width: 140, fontSize: 8.5 },
  optBarBg:     { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, marginHorizontal: 8 },
  optBarFill:   { height: 8, borderRadius: 4 },
  optVotes:     { width: 28, fontSize: 8.5, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  optPct:       { width: 32, fontSize: 8, color: GRAY, textAlign: 'right' },
  // Result badge
  resultBox:    { borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, marginTop: 10 },
  resultTitle:  { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  resultDetail: { fontSize: 8, color: GRAY },
  // Empty state
  emptyBox:     { backgroundColor: LIGHT, borderRadius: 8, paddingVertical: 24, paddingHorizontal: 16, marginTop: 16, alignItems: 'center' },
  // Footer
  footer:       { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerL:      { fontSize: 7.5, color: '#9ca3af' },
  footerR:      { fontSize: 7.5, color: '#9ca3af' },
});

export function InformePDF({ sesion, stats, resultados }) {
  const quorumReq      = stats ? Math.floor(stats.inscritos / 2) + 1 : 0;
  const pctAsist       = stats?.inscritos > 0 ? Math.min(100, Math.round((stats.asistentes / stats.inscritos) * 100)) : 0;
  const quorumAlcanzado = stats ? stats.asistentes >= quorumReq : false;
  const hoy            = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document title={`Informe – ${sesion.nombre}`} author="Nuevo Liberalismo">
      <Page size="A4" style={s.page}>

        {/* ── Encabezado ── */}
        <View style={{ backgroundColor: '#ffffff', paddingVertical: 14, paddingHorizontal: 40, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <Image src={LOGO_URL} style={{ width: 110, objectFit: 'contain' }} />
          <Text style={{ fontSize: 8, color: '#9ca3af', marginLeft: 'auto' }}>Informe generado el {hoy}</Text>
        </View>
        <View style={s.header}>
          <Text style={s.headerParty}>PARTIDO NUEVO LIBERALISMO</Text>
          <Text style={s.headerTitle}>{sesion.nombre}</Text>
          <Text style={s.headerDoc}>Informe oficial de resultados</Text>
        </View>

        <View style={s.body}>

          {/* ── Datos de la sesión ── */}
          <Text style={s.label}>INFORMACIÓN DE LA SESIÓN</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoKey}>Fecha y hora</Text>
              <Text style={s.infoVal}>{sesion.fecha} · {sesion.hora}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoKey}>Lugar</Text>
              <Text style={s.infoVal}>{sesion.lugar}</Text>
            </View>
            {sesion.tipos_asamblea?.nombre && (
              <View style={s.infoRow}>
                <Text style={s.infoKey}>Tipo</Text>
                <Text style={s.infoVal}>{sesion.tipos_asamblea.nombre}</Text>
              </View>
            )}
            {sesion.colectivos?.nombre && (
              <View style={s.infoRow}>
                <Text style={s.infoKey}>Colectivo</Text>
                <Text style={s.infoVal}>{sesion.colectivos.nombre}</Text>
              </View>
            )}
            {sesion.departamento && (
              <View style={s.infoRow}>
                <Text style={s.infoKey}>Departamento</Text>
                <Text style={s.infoVal}>{sesion.departamento}</Text>
              </View>
            )}
            <View style={{ ...s.infoRow, marginBottom: 0 }}>
              <Text style={s.infoKey}>ID</Text>
              <Text style={{ ...s.infoVal, fontFamily: 'Courier', fontSize: 8 }}>{sesion.id}</Text>
            </View>
          </View>

          {/* ── Participación ── */}
          {stats && (
            <>
              <Text style={s.label}>PARTICIPACIÓN</Text>
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statNum}>{stats.inscritos}</Text>
                  <Text style={s.statKey}>Inscritos</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statNum}>{stats.asistentes}</Text>
                  <Text style={s.statKey}>Asistentes</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statNum}>{stats.acreditados ?? '—'}</Text>
                  <Text style={s.statKey}>Acreditados</Text>
                </View>
                <View style={s.statBoxLast}>
                  <Text style={{ ...s.statNum, color: quorumAlcanzado ? GREEN : RED }}>{pctAsist}%</Text>
                  <Text style={s.statKey}>Asistencia</Text>
                </View>
              </View>
              <View style={s.quorumRow}>
                <Text style={s.quorumLabel}>
                  Quórum: {quorumReq} asistentes requeridos (50%+1 de {stats.inscritos})
                </Text>
                <Text style={{ ...s.quorumStatus, color: quorumAlcanzado ? GREEN : RED }}>
                  {quorumAlcanzado ? 'Alcanzado' : 'No alcanzado'}
                </Text>
              </View>
              <View style={s.barBg}>
                <View style={{ ...s.barFill, width: `${pctAsist}%`, backgroundColor: quorumAlcanzado ? GREEN : '#f97316' }} />
              </View>
            </>
          )}

          {/* ── Votaciones ── */}
          <Text style={s.label}>RESULTADOS DE VOTACIONES</Text>

          {resultados.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 9, color: GRAY }}>No se registraron votaciones en esta sesión</Text>
            </View>
          )}

          {resultados.map((preg, idx) => {
            const total   = (preg.opciones || []).reduce((acc, o) => acc + Number(o.total), 0);
            const maxVotos = Math.max(...(preg.opciones || []).map((o) => Number(o.total)), 1);
            const umbral  = preg.tipo_mayoria === 'absoluta'
              ? Math.floor((stats?.inscritos || 0) / 2) + 1
              : Math.floor((stats?.asistentes || 0) / 2) + 1;
            const base      = preg.tipo_mayoria === 'absoluta' ? stats?.inscritos : stats?.asistentes;
            const baseLabel = preg.tipo_mayoria === 'absoluta' ? 'inscritos' : 'asistentes';
            const esValida  = preg.estado === 'cerrada' && total >= umbral;
            const ganador   = preg.estado === 'cerrada' && total > 0
              ? [...(preg.opciones || [])].sort((a, b) => Number(b.total) - Number(a.total))[0]?.respuesta
              : null;

            return (
              <View key={preg.id} style={s.qCard} wrap={false}>
                <Text style={s.qNum}>PREGUNTA {idx + 1}</Text>
                <Text style={s.qText}>{preg.texto}</Text>
                <Text style={s.qType}>
                  {preg.tipo === 'sino' ? 'Votacion Si / No' : 'Votacion por candidatos'}{' '}
                  · Mayoria {preg.tipo_mayoria}
                  {preg.estado !== 'cerrada' ? ' · Pendiente de cierre' : ''}
                </Text>
                <View style={s.divLine} />

                {total === 0 ? (
                  <Text style={{ fontSize: 8.5, color: GRAY }}>Sin votos registrados</Text>
                ) : (
                  (preg.opciones || []).map((op, oi) => {
                    const votes    = Number(op.total);
                    const pct      = total > 0 ? Math.round((votes / total) * 100) : 0;
                    const barWidth = `${Math.round((votes / maxVotos) * 100)}%`;
                    const barColor = op.respuesta === 'SI' ? GREEN
                      : op.respuesta === 'NO' ? RED
                      : BRAND;
                    return (
                      <View key={oi} style={s.optRow}>
                        <Text style={s.optName}>{op.respuesta}</Text>
                        <View style={s.optBarBg}>
                          <View style={{ ...s.optBarFill, width: barWidth, backgroundColor: barColor }} />
                        </View>
                        <Text style={s.optVotes}>{votes}</Text>
                        <Text style={s.optPct}>{pct}%</Text>
                      </View>
                    );
                  })
                )}

                {preg.estado === 'cerrada' && (
                  <View style={{ ...s.resultBox, backgroundColor: esValida ? '#dcfce7' : '#fee2e2' }}>
                    <Text style={{ ...s.resultTitle, color: esValida ? GREEN : RED }}>
                      {esValida ? 'VOTACION VALIDA' : 'VOTACION INVALIDA'}
                    </Text>
                    <Text style={s.resultDetail}>
                      {total} votos de {umbral} requeridos ({baseLabel})
                      {esValida && ganador ? `  ·  Resultado: ${ganador}` : ''}
                      {!esValida ? `  ·  Faltan ${umbral - total} votos` : ''}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerL}>
            © {new Date().getFullYear()} Partido Nuevo Liberalismo · Documento generado automaticamente
          </Text>
          <Text style={s.footerR} render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
