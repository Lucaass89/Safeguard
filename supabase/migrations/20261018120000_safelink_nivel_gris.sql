-- Suma "gris" (no se pudo verificar) a los niveles validos de los analisis y
-- de las fichas compartidas. Un enlace que no se pudo verificar nunca se
-- guarda como "verde".

do $$
declare
  v_tabla text;
  v_conname text;
begin
  foreach v_tabla in array array['safelink_analisis', 'safelink_compartidos'] loop
    for v_conname in
      select conname
      from pg_constraint
      where conrelid = format('public.%I', v_tabla)::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%nivel_riesgo%'
    loop
      execute format('alter table public.%I drop constraint %I', v_tabla, v_conname);
    end loop;
  end loop;
end $$;

alter table public.safelink_analisis
  add constraint safelink_analisis_nivel_riesgo_check
  check (nivel_riesgo in ('verde', 'amarillo', 'rojo', 'gris'));

alter table public.safelink_compartidos
  add constraint safelink_compartidos_nivel_riesgo_check
  check (nivel_riesgo in ('verde', 'amarillo', 'rojo', 'gris'));

create or replace function public.safelink_compartir(
  p_url text,
  p_dominio text,
  p_nivel text,
  p_explicacion text default null,
  p_puntuacion integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
begin
  if v_uid is null then
    raise exception 'Tenés que entrar para compartir';
  end if;

  if p_nivel is null or p_nivel not in ('verde', 'amarillo', 'rojo', 'gris') then
    raise exception 'Nivel inválido';
  end if;

  v_token := encode(gen_random_bytes(9), 'hex');

  insert into public.safelink_compartidos (
    token, usuario_id, url_analizada, dominio, nivel_riesgo, explicacion, puntuacion_riesgo
  ) values (
    v_token, v_uid, p_url, lower(trim(p_dominio)), p_nivel, p_explicacion, p_puntuacion
  );

  return jsonb_build_object('token', v_token);
end;
$$;
