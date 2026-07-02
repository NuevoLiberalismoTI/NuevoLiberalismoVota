// @ts-ignore: Deno types
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore
const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY')!;
// @ts-ignore
const FROM_EMAIL   = Deno.env.get('SENDGRID_FROM_EMAIL')!;

function htmlInvitacion(nombre: string, sesion: {
  nombre: string; fecha: string; hora: string; lugar: string;
}, plataformaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#C20A00;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#fff;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Partido</p>
          <h1 style="margin:6px 0 0;color:#fff;font-size:24px;font-weight:900;">Nuevo Liberalismo</h1>
          <p style="margin:6px 0 0;color:#ffb3b3;font-size:12px;">Plataforma oficial de participación</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:800;">¡Estás invitado/a!</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">
            Hola <strong>${nombre}</strong>, el <strong>Partido Nuevo Liberalismo</strong> te invita a participar en la siguiente sesión:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f8;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:28px;">
            <tr><td>
              <p style="margin:0 0 12px;font-size:18px;font-weight:900;color:#C20A00;">${sesion.nombre}</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;">📅 Fecha</td>
                  <td style="padding:4px 0;font-size:13px;font-weight:700;color:#111827;">${sesion.fecha}</td>
                </tr>
                <tr>
                  <td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;">🕐 Hora</td>
                  <td style="padding:4px 0;font-size:13px;font-weight:700;color:#111827;">${sesion.hora}</td>
                </tr>
                <tr>
                  <td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;">📍 Lugar</td>
                  <td style="padding:4px 0;font-size:13px;font-weight:700;color:#111827;">${sesion.lugar}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${plataformaUrl}" target="_blank"
                style="display:inline-block;background:#C20A00;color:#fff;font-size:15px;font-weight:800;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
                Ir a la plataforma →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
            Si no esperabas este mensaje o tienes dudas, puedes ignorarlo. Para soporte escríbenos a través de los canales oficiales del partido.
          </p>
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { sesion, militantes, plataformaUrl } = await req.json() as {
      sesion:        { nombre: string; fecha: string; hora: string; lugar: string };
      militantes:    { email: string; nombre: string }[];
      plataformaUrl: string;
    };

    if (!sesion || !militantes?.length) {
      return Response.json({ ok: false, error: 'Faltan parámetros' }, { status: 400, headers: CORS });
    }

    const resultados = await Promise.allSettled(
      militantes.map(({ email, nombre }) =>
        fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from:    { email: FROM_EMAIL, name: 'Nuevo Liberalismo' },
            subject: `📩 Invitación: ${sesion.nombre}`,
            content: [{ type: 'text/html', value: htmlInvitacion(nombre, sesion, plataformaUrl) }],
          }),
        }).then((r) => ({ email, ok: r.ok }))
      )
    );

    const enviados = resultados.filter((r) => r.status === 'fulfilled' && (r.value as { ok: boolean }).ok).length;
    const fallidos = resultados.length - enviados;

    return Response.json({ ok: true, enviados, fallidos }, { headers: CORS });

  } catch (err) {
    console.error('enviar-invitacion error:', err);
    return Response.json({ ok: false, error: 'Error interno' }, { status: 500, headers: CORS });
  }
});
