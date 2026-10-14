// Opciones de la cookie de sesión.
// - maxAge 400 días: es el máximo que permiten los navegadores; middleware.js la renueva en cada visita,
//   así que en la práctica la sesión no vence mientras el usuario siga entrando.
// - sameSite 'lax': la cookie se envía al abrir un enlace externo (QR, WhatsApp, correo);
//   con 'strict' el navegador la omitía y parecía que no había sesión.
export const SESSION_COOKIE = 'session';

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path:     '/',
  maxAge:   60 * 60 * 24 * 400,
};
