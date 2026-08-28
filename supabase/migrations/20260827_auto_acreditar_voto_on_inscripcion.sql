-- Al crear una inscripción, acreditar automáticamente con derecho a voto.
-- Esto reemplaza el estado 'preinscrito' por 'acreditado_voto' en el momento del INSERT,
-- sin importar desde qué ruta del sistema se realice la inscripción.

CREATE OR REPLACE FUNCTION fn_auto_acreditar_voto()
RETURNS TRIGGER AS $$
BEGIN
  NEW.estado_acreditacion := 'acreditado_voto';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_acreditar_voto ON inscripciones;
CREATE TRIGGER trg_auto_acreditar_voto
  BEFORE INSERT ON inscripciones
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_acreditar_voto();
