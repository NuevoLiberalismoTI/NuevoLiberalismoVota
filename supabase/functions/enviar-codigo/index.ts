// @ts-ignore: Deno types — instala la extensión "Deno" en VS Code para eliminar estos warnings
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Variables de entorno (se configuran como Secrets en Supabase)
// @ts-ignore
const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY')!;
// @ts-ignore
const FROM_EMAIL   = Deno.env.get('SENDGRID_FROM_EMAIL')!;
// @ts-ignore
const SUPA_URL     = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { cedula, tipo } = await req.json() as {
      cedula: string;
      tipo: 'creacion' | 'cambio_password';
    };

    if (!cedula || !tipo) {
      return Response.json({ ok: false, error: 'Faltan parámetros' }, { status: 400, headers: CORS });
    }

    // Generar y guardar código en Supabase DB
    const supabase = createClient(SUPA_URL, SERVICE_KEY);
    const fn = tipo === 'creacion' ? 'generar_codigo_creacion' : 'solicitar_cambio_password';
    const { data, error } = await supabase.rpc(fn, { p_cedula: cedula });

    if (error || !data?.ok) {
      return Response.json(
        { ok: false, error: data?.error ?? error?.message ?? 'Error al generar código' },
        { headers: CORS }
      );
    }

    const { codigo, email } = data as { codigo: string; email: string };

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

    return Response.json({ ok: true, email }, { headers: CORS });

  } catch (err) {
    console.error('Edge Function error:', err);
    return Response.json({ ok: false, error: 'Error interno' }, { status: 500, headers: CORS });
  }
});
