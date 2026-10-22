-- Enlace de asistencia virtual: código propio de cada asamblea, distinto al del QR presencial.
ALTER TABLE asambleas
  ADD COLUMN IF NOT EXISTS codigo_virtual text;

-- Cómo se registró la asistencia: 'presencial' (QR) o 'virtual' (enlace virtual).
ALTER TABLE asistencia
  ADD COLUMN IF NOT EXISTS modalidad text NOT NULL DEFAULT 'presencial'
    CHECK (modalidad IN ('presencial', 'virtual'));
