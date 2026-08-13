-- Agrega columna telefono (opcional) a invitaciones_enviadas
ALTER TABLE invitaciones_enviadas
  ADD COLUMN IF NOT EXISTS telefono text;
