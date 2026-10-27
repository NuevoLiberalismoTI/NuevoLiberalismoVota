-- Cómo se muestra el quórum en la pantalla de proyección al público, controlado desde el panel:
-- 'oculto' (no se muestra), 'panel' (indicador junto al QR) o 'pantalla' (vista completa con evolución).
ALTER TABLE asambleas
  ADD COLUMN IF NOT EXISTS proyeccion_quorum text NOT NULL DEFAULT 'oculto'
    CHECK (proyeccion_quorum IN ('oculto', 'panel', 'pantalla'));
