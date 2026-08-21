-- Agrega campo suplente por integrante de plancha
ALTER TABLE miembros_plancha
  ADD COLUMN IF NOT EXISTS suplente text;
