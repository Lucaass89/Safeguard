-- La importación solo entra por la función. El insert directo queda para
-- el alta de a una: origen manual y estado activo, que pone la base.
-- La función no lee estado, origen, rol ni empresa del JSON.

drop policy if exists emp_insert on public.empleados;

create policy emp_insert on public.empleados
for insert to authenticated
with check (
  organizacion_id = public.phishguard_org_id()
  and origen = 'manual'
  and estado = 'activo'
);

create or replace function public.phishguard_importar_empleados(p_filas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
    end;
  end loop;

  return jsonb_build_object(
    'cargadas', v_cargadas,
    'omitidas', v_omitidas,
    'errores', v_errores
  );
end;
$$;

revoke all on function public.phishguard_importar_empleados(jsonb) from public, anon;
grant execute on function public.phishguard_importar_empleados(jsonb) to authenticated;
