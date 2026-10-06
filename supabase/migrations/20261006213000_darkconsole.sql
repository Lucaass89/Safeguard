-- Darkconsole: solo la cuenta que dio de alta la empresa puede abrir
-- la consola y lanzar. El alta es el administrador más antiguo de esa
-- organización. Abrir el enlace de simulación queda en mail_abierto.

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
      and actual.organizacion_id is not null
      and actual.auth_user_id = (
        select fundador.auth_user_id
        from public.usuarios_admin fundador
        where fundador.organizacion_id = actual.organizacion_id
          and fundador.rol ilike 'admin%'
          and fundador.auth_user_id is not null
        order by fundador.creado_en asc, fundador.id asc
        limit 1
      )
  );
$$;

create or replace function public.phishguard_darkconsole()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_nombre text;
  v_ultimo uuid;
begin
  select ua.organizacion_id
    into v_org
  from public.usuarios_admin ua
  where ua.auth_user_id = auth.uid()
  limit 1;

  if v_org is not null then
    select o.nombre_empresa into v_nombre
    from public.organizaciones o
    where o.id = v_org;
  end if;

  if not public.phishguard_es_encargado() then
    return jsonb_build_object(
      'encargado', false,
      'organizacion', case
        when v_nombre is null then null
        else jsonb_build_object('nombre_empresa', v_nombre)
      end
    );
  end if;

  select c.id into v_ultimo
  from public.campanas c
  where c.organizacion_id = v_org
    and c.es_refuerzo = false
  order by c.creado_en desc
  limit 1;

  return jsonb_build_object(
    'encargado', true,
    'organizacion', jsonb_build_object('nombre_empresa', v_nombre),
    'areas', coalesce((
      select jsonb_agg(bloque order by bloque->>'nombre')
      from (
        select jsonb_build_object(
          'nombre', area.nombre,
          'personas', jsonb_agg(
            jsonb_build_object('id', e.id, 'nombre', e.nombre)
            order by e.nombre
          )
        ) as bloque
        from public.empleados e
        cross join lateral (
          select coalesce(nullif(btrim(e.departamento), ''), 'General') as nombre
        ) area
        where e.organizacion_id = v_org
          and e.estado = 'activo'
        group by area.nombre
      ) bloques
    ), '[]'::jsonb),
    'plantillas', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'titulo', p.titulo,
          'canal', p.canal,
          'amenaza_dominio', p.amenaza_dominio
        )
        order by p.titulo
      )
      from public.plantillas_phishing p
      where p.canal in ('whatsapp', 'sms', 'email', 'todos')
    ), '[]'::jsonb),
    'ultimo', (
      select jsonb_build_object(
        'id', c.id,
        'nombre', c.nombre_campana,
        'canal', c.canal,
        'plantilla', p.titulo,
        'amenaza_dominio', p.amenaza_dominio,
        'personas', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', e.id,
              'nombre', e.nombre,
              'area', coalesce(nullif(btrim(e.departamento), ''), 'General'),
              'abrio', ev.mail_abierto,
              'clic', ev.hizo_clic,
              'datos', ev.ingreso_datos,
              'explicacion', ev.completo_capacitacion
            )
            order by coalesce(nullif(btrim(e.departamento), ''), 'General'), e.nombre
          )
          from public.eventos_simulacion ev
          join public.empleados e on e.id = ev.empleado_id
          where ev.campana_id = c.id
        ), '[]'::jsonb)
      )
      from public.campanas c
      left join public.plantillas_phishing p on p.id = c.plantilla_id
      where c.id = v_ultimo
    )
  );
end;
$$;

create or replace function public.phishguard_darkconsole_lanzar(
  p_nombre text,
  p_canal text,
  p_plantilla uuid,
  p_empleados uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_nombre text;
  v_canal_plantilla text;
  v_ids uuid[];
  v_ok integer;
  v_campana uuid;
begin
  if not public.phishguard_es_encargado() then
    raise exception 'Con esta cuenta no se puede lanzar un simulacro.';
  end if;

  select ua.organizacion_id into v_org
  from public.usuarios_admin ua
  where ua.auth_user_id = auth.uid()
  limit 1;

  v_nombre := btrim(coalesce(p_nombre, ''));
  if v_nombre = '' or char_length(v_nombre) > 120 then
    raise exception 'Poné un nombre al simulacro.';
  end if;

  if p_canal not in ('whatsapp', 'sms', 'email') then
    raise exception 'Ese canal no está en Darkconsole.';
  end if;

  select p.canal into v_canal_plantilla
  from public.plantillas_phishing p
  where p.id = p_plantilla;

  if v_canal_plantilla is null then
    raise exception 'Esa plantilla no está.';
  end if;

  if v_canal_plantilla <> p_canal and v_canal_plantilla <> 'todos' then
    raise exception 'Esa plantilla no es de ese canal.';
  end if;

  if p_empleados is null or cardinality(p_empleados) = 0 then
    raise exception 'Elegí al menos una persona.';
  end if;

  select coalesce(array_agg(distinct id), '{}')
    into v_ids
  from unnest(p_empleados) as id;

  select count(*) into v_ok
  from public.empleados e
  where e.id = any (v_ids)
    and e.organizacion_id = v_org
    and e.estado = 'activo';

  if v_ok <> cardinality(v_ids) then
    raise exception 'Esas personas no son de tu empresa o no están activas.';
  end if;

  insert into public.campanas (
    organizacion_id,
    plantilla_id,
    nombre_campana,
    estado,
    canal,
    fecha_inicio,
    es_refuerzo,
    grupos
  )
  select
    v_org,
    p_plantilla,
    v_nombre,
    'en_proceso',
    p_canal,
    now(),
    false,
    coalesce(array_agg(distinct coalesce(nullif(btrim(e.departamento), ''), 'General')), '{}')
  from public.empleados e
  where e.id = any (v_ids)
  returning id into v_campana;

  insert into public.eventos_simulacion (campana_id, empleado_id, token_unico)
  select v_campana, e.id, replace(gen_random_uuid()::text, '-', '')
  from public.empleados e
  where e.id = any (v_ids);

  return jsonb_build_object(
    'campana_id', v_campana,
    'personas', v_ok
  );
end;
$$;

create or replace function public.phishguard_registrar(p_token text, p_evento text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_evento not in ('abrio', 'clic', 'datos', 'capacitacion', 'reconocimiento') then
    raise exception 'Evento inválido';
  end if;

  update public.eventos_simulacion
    set
      mail_abierto = mail_abierto or p_evento in ('abrio', 'clic', 'datos'),
      hizo_clic = hizo_clic or p_evento in ('clic', 'datos'),
      ingreso_datos = ingreso_datos or p_evento = 'datos',
      completo_capacitacion = completo_capacitacion or p_evento = 'capacitacion',
      vio_reconocimiento = vio_reconocimiento or p_evento = 'reconocimiento',
      fecha_evento = now()
  where token_unico = p_token;

  if not found then
    return null;
  end if;

  return public.phishguard_ver_simulacion(p_token);
end;
$$;

revoke all on function public.phishguard_es_encargado() from public, anon;
revoke all on function public.phishguard_darkconsole() from public, anon;
revoke all on function public.phishguard_darkconsole_lanzar(text, text, uuid, uuid[]) from public, anon;

grant execute on function public.phishguard_es_encargado() to authenticated;
grant execute on function public.phishguard_darkconsole() to authenticated;
grant execute on function public.phishguard_darkconsole_lanzar(text, text, uuid, uuid[]) to authenticated;
