-- Origen del alta y estados para quien todavía no puede recibir una simulación.
-- La empresa de cada fila la define la sesión, no el archivo.

alter table public.empleados drop constraint if exists empleados_estado_check;

alter table public.empleados
  add constraint empleados_estado_check
  check (estado in (
    'activo',
    'inactivo',
    'pendiente_verificacion',
    'pendiente_aprobacion',
    'rechazado'
  ));

alter table public.empleados
  add column if not exists origen text not null default 'manual';

alter table public.empleados drop constraint if exists empleados_origen_check;

alter table public.empleados
  add constraint empleados_origen_check
  check (origen in ('manual', 'csv', 'link'));

drop policy if exists emp_all on public.empleados;
drop policy if exists emp_select on public.empleados;
drop policy if exists emp_insert on public.empleados;
drop policy if exists emp_update on public.empleados;
drop policy if exists emp_delete on public.empleados;

create policy emp_select on public.empleados
for select to authenticated
using (organizacion_id = public.phishguard_org_id());

create policy emp_insert on public.empleados
for insert to authenticated
with check (
  organizacion_id = public.phishguard_org_id()
  and (
    origen = 'manual'
    or exists (
      select 1
      from public.usuarios_admin ua
      where ua.auth_user_id = auth.uid()
        and ua.rol ilike 'admin%'
    )
  )
);

create policy emp_update on public.empleados
for update to authenticated
using (organizacion_id = public.phishguard_org_id())
with check (organizacion_id = public.phishguard_org_id());

create policy emp_delete on public.empleados
for delete to authenticated
using (organizacion_id = public.phishguard_org_id());

create or replace function public.empleados_bloquear_envio_inactivo()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_estado text;
begin
  select e.estado into v_estado
  from public.empleados e
  where e.id = new.empleado_id;

  if v_estado is distinct from 'activo' then
    raise exception 'Solo se envían simulaciones a personas activas';
  end if;

  return new;
end;
$$;

drop trigger if exists empleados_bloquear_envio_inactivo on public.eventos_simulacion;

create trigger empleados_bloquear_envio_inactivo
before insert on public.eventos_simulacion
for each row
execute function public.empleados_bloquear_envio_inactivo();

create or replace function public.phishguard_programar_refuerzo(
  p_campana_id uuid,
  p_empleado_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_camp record;
  v_refuerzo record;
  v_plantilla uuid;
  v_pendientes uuid[];
begin
  if not exists (
    select 1
    from public.empleados
    where id = p_empleado_id
      and estado = 'activo'
  ) then
    return;
  end if;

  select id, organizacion_id, canal, plantilla_id, es_refuerzo, nombre_campana
  into v_camp
  from public.campanas
  where id = p_campana_id;

  if v_camp.id is null or v_camp.es_refuerzo then
    return;
  end if;

  select id into v_plantilla
  from public.plantillas_phishing
  where (canal = v_camp.canal or canal = 'todos')
    and nivel_dificultad = 'alto'
    and (v_camp.plantilla_id is null or id <> v_camp.plantilla_id)
  order by creado_en
  limit 1;

  if v_plantilla is null then
    select id into v_plantilla
    from public.plantillas_phishing
    where nivel_dificultad = 'alto'
    limit 1;
  end if;

  if v_plantilla is null then
    v_plantilla := v_camp.plantilla_id;
  end if;

  select id, extra, estado
  into v_refuerzo
  from public.campanas
  where origen_campana_id = p_campana_id
    and es_refuerzo
  limit 1;

  if v_refuerzo.id is null then
    insert into public.campanas (
      organizacion_id, plantilla_id, nombre_campana, estado, canal,
      origen_campana_id, es_refuerzo, fecha_inicio, extra
    ) values (
      v_camp.organizacion_id,
      v_plantilla,
      format('Refuerzo · %s', v_camp.nombre_campana),
      'programada',
      v_camp.canal,
      p_campana_id,
      true,
      now() + interval '21 days',
      jsonb_build_object('pendientes', jsonb_build_array(p_empleado_id))
    );
    return;
  end if;

  v_pendientes := array(
    select jsonb_array_elements_text(coalesce(v_refuerzo.extra->'pendientes', '[]'::jsonb))::uuid
  );

  if p_empleado_id = any (v_pendientes) then
    return;
  end if;

  if exists (
    select 1 from public.eventos_simulacion
    where campana_id = v_refuerzo.id and empleado_id = p_empleado_id
  ) then
    return;
  end if;

  if v_refuerzo.estado = 'en_proceso' then
    insert into public.eventos_simulacion (campana_id, empleado_id, token_unico)
    values (
      v_refuerzo.id,
      p_empleado_id,
      encode(gen_random_bytes(16), 'hex')
    );
  else
    update public.campanas
      set extra = jsonb_set(
        coalesce(extra, '{}'::jsonb),
        '{pendientes}',
        coalesce(extra->'pendientes', '[]'::jsonb) || to_jsonb(p_empleado_id)
      )
    where id = v_refuerzo.id;
  end if;
end;
$$;

create or replace function public.phishguard_activar_refuerzos()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := public.phishguard_org_id();
  v_camp record;
  v_emp uuid;
  v_n integer := 0;
begin
  if v_org is null then
    return 0;
  end if;

  for v_camp in
    select id, extra
    from public.campanas
    where organizacion_id = v_org
      and es_refuerzo
      and estado = 'programada'
      and fecha_inicio <= now()
  loop
    for v_emp in
      select e.id
      from jsonb_array_elements_text(coalesce(v_camp.extra->'pendientes', '[]'::jsonb)) as pendiente(valor)
      join public.empleados e
        on e.id = pendiente.valor::uuid
       and e.estado = 'activo'
    loop
      insert into public.eventos_simulacion (campana_id, empleado_id, token_unico)
      values (v_camp.id, v_emp, encode(gen_random_bytes(16), 'hex'))
      on conflict (campana_id, empleado_id) do nothing;
    end loop;

    update public.campanas
      set estado = 'en_proceso',
          extra = jsonb_set(coalesce(extra, '{}'::jsonb), '{pendientes}', '[]'::jsonb)
    where id = v_camp.id;

    v_n := v_n + 1;
  end loop;

  return v_n;
end;
$$;

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
    v_email := lower(btrim(coalesce(v_fila->>'correo', '')));
    v_area := btrim(coalesce(v_fila->>'area', ''));

    if v_nombre = ''
       or length(v_nombre) > 200
       or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       or length(v_email) > 320
       or length(v_area) > 120
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
        and lower(e.email) = v_email
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
