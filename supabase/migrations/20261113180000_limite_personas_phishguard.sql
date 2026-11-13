-- Límite de personas activas por organización en PhishGuard.
-- Se permite hasta un 10 % por encima de lo contratado, redondeado hacia arriba.
-- Las organizaciones sin cantidad guardada cuentan como 25 personas, lo que cubre el mínimo de USD 25.
-- Pasado el límite no se pueden activar más personas. A nadie que ya está activo se lo desactiva.

create or replace function public.phishguard_limite_personas(p_org uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (coalesce(o.usuarios_contratados, 25) * 11 + 9) / 10
  from public.organizaciones o
  where o.id = p_org
$$;

revoke all on function public.phishguard_limite_personas(uuid) from public, anon;
revoke all on function public.phishguard_limite_personas(uuid) from authenticated;

create or replace function public.empleados_respetar_limite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limite integer;
  v_activos integer;
  v_contratados integer;
begin
  if new.estado is distinct from 'activo' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.estado = 'activo'
     and old.organizacion_id = new.organizacion_id then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('phishguard_limite:' || new.organizacion_id::text));

  v_limite := public.phishguard_limite_personas(new.organizacion_id);
  if v_limite is null then
    return new;
  end if;

  select count(*) into v_activos
  from public.empleados e
  where e.organizacion_id = new.organizacion_id
    and e.estado = 'activo'
    and e.id is distinct from new.id;

  if v_activos >= v_limite then
    select coalesce(o.usuarios_contratados, 25) into v_contratados
    from public.organizaciones o
    where o.id = new.organizacion_id;

    raise exception using
      errcode = 'SG001',
      message = format(
        'Llegaste al límite de tu plan: %s personas activas (%s contratadas más el 10 %%). Ampliá el plan para sumar más.',
        v_limite,
        v_contratados
      );
  end if;

  return new;
end;
$$;

drop trigger if exists empleados_respetar_limite on public.empleados;

create trigger empleados_respetar_limite
  before insert or update of estado, organizacion_id on public.empleados
  for each row
  execute function public.empleados_respetar_limite();

create or replace function public.phishguard_importar_empleados(p_filas jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_org uuid;
  v_rol text;
  v_fila jsonb;
  v_nombre text;
  v_email text;
  v_area text;
  v_cargadas integer := 0;
  v_omitidas integer := 0;
  v_errores integer := 0;
  v_sin_lugar integer := 0;
begin
  v_org := public.phishguard_org_id();
  if v_org is null then
    raise exception 'No hay empresa';
  end if;

  select ua.rol into v_rol
  from public.usuarios_admin ua
  where ua.auth_user_id = auth.uid();

  if v_rol is null or v_rol not ilike 'admin%' then
    raise exception 'Solo un administrador de la empresa puede importar';
  end if;

  if p_filas is null or jsonb_typeof(p_filas) <> 'array' then
    raise exception 'El archivo no tiene filas';
  end if;

  if jsonb_array_length(p_filas) > 1000 then
    raise exception 'El archivo supera las 1000 filas';
  end if;

  for v_fila in
    select value from jsonb_array_elements(p_filas)
  loop
    v_nombre := btrim(coalesce(v_fila->>'nombre', ''));
    v_email := regexp_replace(lower(btrim(coalesce(v_fila->>'correo', ''))), '[[:space:]]', '', 'g');
    v_area := btrim(coalesce(v_fila->>'area', ''));

    while left(v_email, 7) = 'mailto:' loop
      v_email := substr(v_email, 8);
    end loop;

    if v_nombre = ''
       or length(v_nombre) > 200
       or v_nombre ~ '^[=+\-@]'
       or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       or length(v_email) > 320
       or length(v_area) > 120
       or (v_area <> '' and v_area ~ '^[=+\-@]')
    then
      v_errores := v_errores + 1;
      continue;
    end if;

    if v_area = '' then
      v_area := 'General';
    end if;

    if exists (
      select 1
      from public.empleados e
      where e.organizacion_id = v_org
        and regexp_replace(lower(e.email), '[[:space:]]', '', 'g') = v_email
    ) then
      v_omitidas := v_omitidas + 1;
      continue;
    end if;

    begin
      insert into public.empleados (
        organizacion_id, nombre, email, departamento, estado, origen
      ) values (
        v_org, v_nombre, v_email, v_area, 'activo', 'csv'
      );
      v_cargadas := v_cargadas + 1;
    exception
      when unique_violation then
        v_omitidas := v_omitidas + 1;
      when sqlstate 'SG001' then
        v_sin_lugar := v_sin_lugar + 1;
    end;
  end loop;

  return jsonb_build_object(
    'cargadas', v_cargadas,
    'omitidas', v_omitidas,
    'errores', v_errores,
    'sin_lugar', v_sin_lugar
  );
end;
$function$;
