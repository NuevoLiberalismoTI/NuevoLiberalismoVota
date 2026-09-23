import { requireAdmin } from '../../../../lib/session';

const WA_PHONE_ID    = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_TOKEN       = process.env.WHATSAPP_ACCESS_TOKEN;
const TEMPLATE_NAME  = 'convocatoria_asamblea_territorial';
const TEMPLATE_LANG  = 'es';
const BATCH_SIZE     = 5;
const BATCH_DELAY_MS = 300;

function normTel(tel) {
  const d = String(tel).replace(/\D/g, '');
  if (d.startsWith('57') && d.length >= 11) return d;
  if (d.length === 10) return `57${d}`;
  return d;
}

async function enviarWA(telefono, vars) {
  const to = normTel(telefono);
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: TEMPLATE_NAME,
      language: { code: TEMPLATE_LANG },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'text', text: vars.v1 }],
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: vars.v1 },
            { type: 'text', text: vars.v2 },
            { type: 'text', text: vars.v3 },
            { type: 'text', text: vars.v4 },
            { type: 'text', text: vars.v5 },
            { type: 'text', text: vars.v6 },
            { type: 'text', text: vars.v7 },
          ],
        },
      ],
    },
  };

  const res = await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    return { ok: false, error: txt };
  }
  return { ok: true };
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  if (!WA_PHONE_ID || !WA_TOKEN) {
    return Response.json({ ok: false, error: 'Credenciales de WhatsApp no configuradas en el servidor' }, { status: 500 });
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
        return { nombre: c.nombre, telefono: c.telefono, ...r };
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

  return Response.json({ ok: true, enviados, fallidos, total: contactos.length, resultados });
}
