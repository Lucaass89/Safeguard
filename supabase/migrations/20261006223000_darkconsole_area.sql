-- El lanzamiento queda en una sola función: el área elegida y las
-- personas activas de esa empresa. Se descarta la variante que no pedía el área.

drop function if exists public.phishguard_darkconsole_lanzar(text, text, uuid, uuid[]);

create or replace function public.phishguard_es_encargado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuarios_admin actual
    where actual.auth_user_id = auth.uid()
      and actual.rol = 'Admin_Principal'
      and actual.organizacion_id is not null
      and actual.auth_user_id = (
        select fundador.auth_user_id
        from public.usuarios_admin fundador
        where fundador.organizacion_id = actual.organizacion_id
          and fundador.rol = 'Admin_Principal'
          and fundador.auth_user_id is not null
        order by fundador.creado_en asc, fundador.id asc
        limit 1
      )
  );
$$;

create or replace function public.phishguard_darkconsole_lanzar(
  p_nombre text,
  p_canal text,
  p_plantilla uuid,
  p_area text,
  p_empleados uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_canal_tpl text;
  v_ids uuid[];
  v_campana uuid;
  v_pedidos int;
begin
  if not public.phishguard_es_encargado() then
    raise exception 'Con esta cuenta no se puede lanzar un simulacro.';
  end if;

  select a.organizacion_id into v_org
  from public.usuarios_admin a
  where a.auth_user_id = auth.uid()
  limit 1;

  if p_canal not in ('whatsapp', 'sms', 'email') then
    raise exception 'Ese canal no está en Darkconsole.';
  end if;

  if coalesce(btrim(p_nombre), '') = '' or char_length(btrim(p_nombre)) > 120 then
    raise exception 'Poné un nombre al simulacro.';
  end if;

  select p.canal into v_canal_tpl
  from public.plantillas_phishing p
  where p.id = p_plantilla;

  if v_canal_tpl is null then
    raise exception 'Esa plantilla no está.';
  end if;

  if v_canal_tpl not in (p_canal, 'todos') then
    raise exception 'Esa plantilla no es de ese canal.';
  end if;

  v_pedidos := coalesce(array_length(p_empleados, 1), 0);

  if v_pedidos = 0 then
    raise exception 'Elegí un área o al menos una persona.';
  end if;

  select coalesce(array_agg(e.id), '{}')
    into v_ids
  from public.empleados e
  where e.organizacion_id = v_org
    and e.estado = 'activo'
    and (
      coalesce(btrim(p_area), '') = ''
      or lower(coalesce(nullif(btrim(e.departamento), ''), 'General')) = lower(btrim(p_area))
    )
    and e.id = any (p_empleados);

  if coalesce(array_length(v_ids, 1), 0) <> (
    select count(distinct x) from unnest(p_empleados) as x
  ) then
    raise exception 'Esas personas no son de tu empresa o no están activas en el área elegida.';
  end if;

  insert into public.campanas (
    organizacion_id, plantilla_id, nombre_campana, estado, canal, fecha_inicio, es_refuerzo
  )
  values (
    v_org,
    p_plantilla,
    btrim(p_nombre),
    'en_proceso',
    p_canal,
    now(),
    false
  )
  returning id into v_campana;

  insert into public.eventos_simulacion (campana_id, empleado_id, token_unico)
  select v_campana, id, replace(gen_random_uuid()::text, '-', '')
  from unnest(v_ids) as id;

  return jsonb_build_object(
    'campana_id', v_campana,
    'personas', array_length(v_ids, 1)
  );
end;
$$;

revoke all on function public.phishguard_es_encargado() from public, anon;
revoke all on function public.phishguard_darkconsole_lanzar(text, text, uuid, text, uuid[]) from public, anon;
grant execute on function public.phishguard_es_encargado() to authenticated;
grant execute on function public.phishguard_darkconsole_lanzar(text, text, uuid, text, uuid[]) to authenticated;
