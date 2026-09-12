-- Función para crear usuarios de modo rápido con contraseña aleatoria (bcrypt via pgcrypto)
CREATE OR REPLACE FUNCTION crear_usuario_rapido(
  p_cedula text,
  p_nombre text,
  p_email  text
) RETURNS json AS $$
BEGIN
  INSERT INTO usuarios (cedula, nombre, email, password_hash, rol, es_rapido)
  VALUES (
    p_cedula,
    p_nombre,
    p_email,
    crypt(gen_random_uuid()::text, gen_salt('bf')),
    'usuario',
    true
  );
  RETURN json_build_object('ok', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('ok', true, 'existia', true);
  WHEN OTHERS THEN
    RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
