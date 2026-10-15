-- Modalidad con la que el inscrito asistirá a la asamblea: presencial o virtual.
-- NULL = aún no ha respondido (la plataforma le muestra una ventana obligatoria para elegir).
ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS modalidad_asistencia text
    CHECK (modalidad_asistencia IN ('presencial', 'virtual'));

ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS modalidad_actualizada_en timestamptz;
