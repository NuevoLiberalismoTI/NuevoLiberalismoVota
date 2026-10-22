// @ts-ignore: Deno types — instala la extensión "Deno" en VS Code para eliminar estos warnings
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Variables de entorno (se configuran como Secrets en Supabase)
// @ts-ignore
const SENDGRID_KEY  = Deno.env.get('SENDGRID_API_KEY')!;
// @ts-ignore
const FROM_EMAIL    = Deno.env.get('SENDGRID_FROM_EMAIL')!;
// @ts-ignore
const SUPA_URL      = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// @ts-ignore
const TWILIO_SID    = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
// @ts-ignore
const TWILIO_KEY    = Deno.env.get('TWILIO_API_KEY') ?? '';
// @ts-ignore
const TWILIO_AUTH   = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
// @ts-ignore
const TWILIO_FROM   = Deno.env.get('TWILIO_WHATSAPP_FROM') ?? 'whatsapp:+14155238886';
// ContentSid de la plantilla de autenticación (categoría AUTHENTICATION) aprobada por Meta
// @ts-ignore
const SID_CODIGO    = (Deno.env.get('TWILIO_CONTENT_SID_CODIGO') ?? '').trim().replace(/^["']|["']$/g, '');

// Token de la API de militantes (secret MILITANTES_API_TOKEN en Supabase)
// @ts-ignore
const MILITANTES_TOKEN = Deno.env.get('MILITANTES_API_TOKEN') ?? '';

// El código siempre se envía al correo registrado en la militancia (no al de la cuenta,
// que en usuarios rápidos puede ser otro). Devuelve '' si no se pudo consultar o no tiene correo.
async function emailMilitancia(cedula: string): Promise<string> {
  if (!MILITANTES_TOKEN) {
    console.warn('[enviar-codigo] MILITANTES_API_TOKEN no configurado: no se consulta el correo de la militancia');
    return '';
  }
  try {
    const res = await fetch(
      `https://www.nuevoliberalismo.org/wp-json/nl/v1/militantes/cedula/${encodeURIComponent(cedula)}?token=${MILITANTES_TOKEN}`,
    );
    if (!res.ok) return '';
    const m = await res.json();
    return String(m?.email ?? '').trim();
  } catch (err) {
    console.error('[enviar-codigo] Error consultando militancia:', err);
    return '';
  }
}

// Meta no permite mensajes libres fuera de la ventana de 24 h: el código solo se puede
// enviar con una plantilla de autenticación aprobada, cuya única variable es el código.
async function enviarWhatsApp(telefono: string, codigo: string): Promise<void> {
  if (!TWILIO_SID || !TWILIO_AUTH || !SID_CODIGO) {
    console.warn('[WhatsApp] Código no enviado: faltan secrets de Twilio o TWILIO_CONTENT_SID_CODIGO');
    return;
  }
  const numero = telefono.startsWith('+') ? telefono : `+57${telefono}`;

  const authUser = TWILIO_KEY || TWILIO_SID;
  const body = new URLSearchParams({
    From:             TWILIO_FROM,
    To:               `whatsapp:${numero}`,
    ContentSid:       SID_CODIGO,
    ContentVariables: JSON.stringify({ '1': codigo }),
  });
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${authUser}:${TWILIO_AUTH}`)}`,
          'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );
    if (!res.ok) console.error(`[WhatsApp] Twilio error ${res.status}:`, await res.text(), '| From:', TWILIO_FROM, '| ContentSid:', SID_CODIGO);
  } catch (err) {
    // El correo ya fue enviado; el fallo de WhatsApp no bloquea el flujo
    console.error('[WhatsApp] Excepción al llamar Twilio:', err);
  }
}

function htmlCorreo(codigo: string, tipo: 'creacion' | 'cambio_password'): string {
  const esCreacion = tipo === 'creacion';
  const titulo = esCreacion ? 'Verificación de cuenta' : 'Recuperación de contraseña';
  const intro  = esCreacion
    ? 'Para completar la creación de tu cuenta en la plataforma del <strong>Nuevo Liberalismo</strong>, ingresa el siguiente código:'
    : 'Recibimos una solicitud para cambiar la contraseña de tu cuenta en el <strong>Nuevo Liberalismo</strong>. Usa el siguiente código:';
  const nota = esCreacion
    ? 'Si no solicitaste crear una cuenta, ignora este correo.'
    : 'Si no solicitaste este cambio, ignora este correo. Tu cuenta sigue segura.';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#C20A00;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#fff;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Partido</p>
          <h1 style="margin:6px 0 0;color:#fff;font-size:24px;font-weight:900;">Nuevo Liberalismo</h1>
          <p style="margin:6px 0 0;color:#ffb3b3;font-size:12px;">Plataforma oficial de participación</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:800;">${titulo}</h2>
          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">${intro}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <div style="display:inline-block;background:#fff1f0;border:2px solid #C20A00;border-radius:12px;padding:20px 40px;">
                <p style="margin:0 0 8px;font-size:11px;color:#C20A00;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Tu código de verificación</p>
                <p style="margin:0;font-size:44px;font-weight:900;color:#C20A00;letter-spacing:10px;font-family:'Courier New',monospace;">${codigo}</p>
              </div>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:12px 16px;">
              <p style="margin:0;font-size:13px;color:#854d0e;">⏱ <strong>Este código expira en 15 minutos.</strong> Si necesitas uno nuevo, solicítalo desde la aplicación.</p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">${nota}</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">
            © ${new Date().getFullYear()} Nuevo Liberalismo · Todos los derechos reservados<br/>
            Este es un correo automático, no respondas a este mensaje.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { cedula, tipo, email: emailBody } = await req.json() as {
      cedula: string;
      tipo: 'creacion' | 'cambio_password';
      email?: string;
    };

    if (!cedula || !tipo) {
      return Response.json({ ok: false, error: 'Faltan parámetros' }, { status: 400, headers: CORS });
    }

    const supabase = createClient(SUPA_URL, SERVICE_KEY);
    let codigo: string;
    let email: string;

    if (emailBody) {
      // Email viene directamente de la API externa — no se consulta militantes
      codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expira_en = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { error: insErr } = await supabase
        .from('codigos_pendientes')
        .insert({ cedula, codigo, expira_en, usado: false });

      if (insErr) {
        return Response.json({ ok: false, error: 'Error al generar código' }, { headers: CORS });
      }

      email = emailBody;
    } else {
      // Flujo legado (recuperar contraseña): usa la RPC que lee de la tabla local
      const fn = tipo === 'creacion' ? 'generar_codigo_creacion' : 'solicitar_cambio_password';
      const { data, error } = await supabase.rpc(fn, { p_cedula: cedula });

      if (error || !data?.ok) {
        return Response.json(
          { ok: false, error: data?.error ?? error?.message ?? 'Error al generar código' },
          { headers: CORS }
        );
      }

      codigo = (data as { codigo: string; email: string }).codigo;
      email  = (data as { codigo: string; email: string }).email;
    }

    // Prioridad: correo de la militancia. Si no tiene, el que llegó en la petición o el de la cuenta.
    const correoMilitancia = await emailMilitancia(cedula);
    if (correoMilitancia) email = correoMilitancia;
    if (!email || email.endsWith('@rapido.nliberal.co')) {
      return Response.json(
        { ok: false, error: 'No tienes un correo registrado en la militancia. Actualiza tus datos con el partido.' },
        { headers: CORS }
      );
    }

    // Enviar correo vía SendGrid
    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from:    { email: FROM_EMAIL, name: 'Nuevo Liberalismo' },
        subject: tipo === 'creacion'
          ? '🔐 Código de verificación — Nuevo Liberalismo'
          : '🔑 Recuperación de contraseña — Nuevo Liberalismo',
        content: [{ type: 'text/html', value: htmlCorreo(codigo, tipo) }],
      }),
    });

    if (!sgRes.ok) {
      const sgErr = await sgRes.text();
      console.error('SendGrid error:', sgErr);
      return Response.json(
        { ok: false, error: 'Error al enviar el correo. Verifica la configuración de SendGrid.' },
        { headers: CORS }
      );
    }

    // Enviar también por WhatsApp si hay teléfono registrado en invitaciones
    const { data: invData } = await supabase
      .from('invitaciones_enviadas')
      .select('telefono')
      .eq('cedula', cedula)
      .not('telefono', 'is', null)
      .order('enviado_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invData?.telefono) {
      await enviarWhatsApp(invData.telefono, codigo);
    }

    return Response.json({ ok: true, email }, { headers: CORS });

  } catch (err) {
    console.error('Edge Function error:', err);
    return Response.json({ ok: false, error: 'Error interno' }, { status: 500, headers: CORS });
  }
});
