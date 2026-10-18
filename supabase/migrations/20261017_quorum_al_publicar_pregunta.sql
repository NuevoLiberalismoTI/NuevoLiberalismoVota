-- Estado del quórum en el momento de publicar cada pregunta.
-- Permite votar sin quórum dejando constancia en el informe.
ALTER TABLE asamblea_preguntas
  ADD COLUMN IF NOT EXISTS sin_quorum            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asistentes_al_publicar integer,
  ADD COLUMN IF NOT EXISTS quorum_requerido       integer;
