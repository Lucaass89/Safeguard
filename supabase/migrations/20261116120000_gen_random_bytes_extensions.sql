-- pgcrypto está en el esquema extensions. Las funciones con search_path vacío no encontraban gen_random_bytes:
-- fallaban "Compartir alerta" y la creación de tokens de los refuerzos de PhishGuard.
-- Se reescribe solo esa llamada sobre la definición que ya está en la base, sin tocar el resto de la lógica.

do $$
declare
  v_funcion record;
  v_definicion text;
begin
  for v_funcion in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname in ('safelink_compartir', 'phishguard_programar_refuerzo', 'phishguard_activar_refuerzos')
  loop
    v_definicion := pg_get_functiondef(v_funcion.oid);
    if v_definicion ~ '(^|[^.])gen_random_bytes\(' then
      v_definicion := regexp_replace(v_definicion, '(^|[^.])gen_random_bytes\(', '\1extensions.gen_random_bytes(', 'g');
      execute v_definicion;
    end if;
  end loop;
end $$;
