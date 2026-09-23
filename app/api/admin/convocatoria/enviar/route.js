import { requireAdmin } from '../../../../lib/session';
import { createServerClient } from '../../../../lib/supabase-server';

const TWILIO_SID    = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_KEY    = process.env.TWILIO_API_KEY;
const TWILIO_AUTH   = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM   = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';
const CONTENT_SID   = process.env.TWILIO_CONTENT_SID_CONVOCATORIA;
const BATCH_SIZE    = 5;
const BATCH_DELAY_MS = 300;

function normTel(tel) {
  const d = String(tel).replace(/\D/g, '');
  if (d.startsWith('57') && d.length >= 11) return `+${d}`;
  if (d.length === 10) return `+57${d}`;
  return `+${d}`;
}

async function enviarWA(telefono, vars) {
  const to   = `whatsapp:${normTel(telefono)}`;
  const auth = TWILIO_KEY || TWILIO_SID;

  const body = new URLSearchParams({
    From:             TWILIO_FROM,
    To:               to,
    ContentSid:       CONTENT_SID,
    ContentVariables: JSON.stringify({
      '1': vars.v1,
      '2': vars.v2,
      '3': vars.v3,
      '4': vars.v4,
      '5': vars.v5,
      '6': vars.v6,
      '7': vars.v7,
    }),
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${Buffer.from(`${auth}:${TWILIO_AUTH}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    return { ok: false, error: txt };
  }
  return { ok: true };
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  if (!TWILIO_SID || !TWILIO_AUTH || !CONTENT_SID) {
    return Response.json({ ok: false, error: 'Credenciales de Twilio no configuradas en el servidor' }, { status: 500 });
  }

  const { variables, contactos } = await request.json();

  if (!variables?.v1 || !contactos?.length) {
    return Response.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
  }

  const resultados = [];

  for (let i = 0; i < contactos.length; i += BATCH_SIZE) {
    const batch = contactos.slice(i, i + BATCH_SIZE);
    const parciales = await Promise.allSettled(
      batch.map(async (c) => {
        const r = await enviarWA(c.telefono, variables);
        return { nombre: c.nombre, telefono: c.telefono, email: c.email || null, ...r };
      })
    );
    resultados.push(
      ...parciales.map((r) =>
        r.status === 'fulfilled' ? r.value : { ok: false, error: String(r.reason) }
      )
    );
    if (i + BATCH_SIZE < contactos.length) {
      await new Promise((res) => setTimeout(res, BATCH_DELAY_MS));
    }
  }

  const enviados = resultados.filter((r) => r.ok).length;
  const fallidos = resultados.filter((r) => !r.ok).length;

  // Guardar soporte del envío
  const supabase = createServerClient();
  await supabase.from('convocatorias_enviadas').insert([{
    departamento: variables.v1,
    variables,
    enviado_por:  session.cedula,
    total:        contactos.length,
    enviados,
    fallidos,
    contactos:    resultados,
  }]);

  return Response.json({ ok: true, enviados, fallidos, total: contactos.length, resultados });
}
