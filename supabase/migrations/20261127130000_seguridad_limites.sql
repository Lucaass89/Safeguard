-- Límites de uso, funciones viejas cerradas y permisos de tablas recortados a lo que permiten las políticas.

create table if not exists public.limites_uso (
  clave text not null,
  creado_en timestamptz not null default now()
);

create index if not exists limites_uso_clave_idx on public.limites_uso (clave, creado_en desc);

alter table public.limites_uso enable row level security;
revoke all on public.limites_uso from public, anon, authenticated;

create or replace function public.limite_pasar(p_clave text, p_max integer, p_segundos integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_usados integer;
begin
  if p_clave is null or char_length(p_clave) not between 1 and 200 then
    return false;
  end if;
  if random() < 0.01 then
    delete from public.limites_uso where creado_en < now() - interval '2 days';
  end if;
  select count(*) into v_usados
  from public.limites_uso
  where clave = p_clave and creado_en > now() - make_interval(secs => p_segundos);
  if v_usados >= p_max then
    return false;
  end if;
  insert into public.limites_uso (clave) values (p_clave);
  return true;
end;
$$;

revoke all on function public.limite_pasar(text, integer, integer) from public, anon, authenticated;
grant execute on function public.limite_pasar(text, integer, integer) to service_role;

create or replace function public.familia_aceptar(p_codigo text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cuidado uuid;
  v_codigo text := upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  if not public.limite_pasar('familia_aceptar:' || auth.uid(), 10, 3600) then
    raise exception 'Probaste muchos códigos seguidos. Esperá una hora y volvé a intentar.';
  end if;

  select cuidado_id into v_cuidado
  from public.familia_invitaciones
  where codigo = v_codigo and vence > now();

  if v_cuidado is null then
    raise exception 'El código no existe o ya venció';
  end if;
  if v_cuidado = auth.uid() then
    raise exception 'Ese código es tuyo: lo tiene que escribir la persona que te va a cuidar';
  end if;

  insert into public.familia_vinculos (cuidador_id, cuidado_id)
  values (auth.uid(), v_cuidado)
  on conflict do nothing;

  delete from public.familia_invitaciones where codigo = v_codigo;

  return public.familia_nombre(v_cuidado);
end;
$$;

create or replace function public.safelink_reportar(p_dominio text, p_motivo text default null, p_origin_type text default 'web')
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_uid uuid := auth.uid();
  v_dominio text := lower(trim(p_dominio));
  v_motivo text := nullif(left(trim(coalesce(p_motivo, '')), 500), '');
  v_origen text := left(coalesce(nullif(trim(p_origin_type), ''), 'web'), 30);
  v_nivel text;
  v_veces integer;
  v_codigo text;
  v_cierre text;
begin
  if v_uid is null then
    raise exception 'Tenés que entrar para reportar';
  end if;

  if v_dominio is null or char_length(v_dominio) not between 3 and 253
     or v_dominio !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' then
    raise exception 'Falta el dominio';
  end if;

  if not public.limite_pasar('safelink_reportar:' || v_uid, 10, 3600)
     or not public.limite_pasar('safelink_reportar_dia:' || v_uid, 30, 86400) then
    raise exception 'Mandaste muchos reportes seguidos. Probá de nuevo más tarde.';
  end if;

  select nivel, veces_reportado into v_nivel, v_veces
  from public.amenazas
  where dominio = v_dominio;

  if v_nivel is null then
    insert into public.amenazas (dominio, nivel, motivo, origen, veces_reportado)
    values (v_dominio, 'rojo', v_motivo, 'reporte', 1);
    v_codigo := 'nuevo';
    v_cierre := 'Recibimos tu reporte y lo marcamos en rojo en la base regional.';
  elsif v_nivel = 'rojo' then
    update public.amenazas
      set veces_reportado = veces_reportado + 1,
          actualizada_en = now(),
          motivo = coalesce(v_motivo, motivo)
    where dominio = v_dominio;
    v_codigo := 'ya_estaba';
    v_cierre := format(
      'Ya estaba en rojo: otras personas también lo reportaron (%s veces).',
      v_veces + 1
    );
  else
    update public.amenazas
      set nivel = 'rojo',
          veces_reportado = veces_reportado + 1,
          actualizada_en = now(),
          origen = 'reporte',
          motivo = coalesce(v_motivo, motivo)
    where dominio = v_dominio;
    v_codigo := 'marcado_rojo';
    v_cierre := format('Estaba marcado en %s y lo pasamos a rojo.', v_nivel);
  end if;

  insert into public.safelink_reportes (
    usuario_id, dominio, motivo, estado, cierre, origin_type
  ) values (
    v_uid, v_dominio, v_motivo, 'revisado', v_cierre, v_origen
  );

  return jsonb_build_object('codigo', v_codigo, 'cierre', v_cierre);
end;
$$;

create or replace function public.safelink_compartir(p_url text, p_dominio text, p_nivel text, p_explicacion text default null, p_puntuacion integer default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
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

  if char_length(coalesce(p_url, '')) > 2048 or char_length(coalesce(p_dominio, '')) > 253
     or char_length(coalesce(p_explicacion, '')) > 4000
     or (p_puntuacion is not null and p_puntuacion not between 0 and 100) then
    raise exception 'Datos inválidos';
  end if;

  if not public.limite_pasar('safelink_compartir:' || v_uid, 30, 3600) then
    raise exception 'Compartiste muchos resultados seguidos. Probá de nuevo más tarde.';
  end if;

  v_token := encode(extensions.gen_random_bytes(9), 'hex');

  insert into public.safelink_compartidos (
    token, usuario_id, url_analizada, dominio, nivel_riesgo, explicacion, puntuacion_riesgo
  ) values (
    v_token, v_uid, p_url, lower(trim(p_dominio)), p_nivel, p_explicacion, p_puntuacion
  );

  return jsonb_build_object('token', v_token);
end;
$$;

create or replace function public.push_registrar(p_token text, p_phishguard boolean default true)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  if p_token is null or char_length(p_token) not between 20 and 4096 then
    raise exception 'Token inválido';
  end if;
  if not public.limite_pasar('push_registrar:' || auth.uid(), 30, 3600) then
    raise exception 'Demasiados intentos. Probá de nuevo más tarde.';
  end if;

  insert into public.push_dispositivos (token, usuario_id, phishguard, actualizado)
  values (p_token, auth.uid(), coalesce(p_phishguard, true), now())
  on conflict (token) do update
    set usuario_id = excluded.usuario_id,
        phishguard = excluded.phishguard,
        actualizado = now();
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.provision_it_admin(text, text, text)',
    'public.phishguard_pagar_prueba()',
    'public.complete_sim_training(text)',
    'public.mark_sim_click(text, text)',
    'public.get_sim_by_token(text)',
    'public.rls_auto_enable()',
    'public.empleados_respetar_limite()',
    'public.empleados_solo_admin_cambia_estado()',
    'public.phishguard_al_caer()'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('revoke all on function %s from public, anon, authenticated', f);
    end if;
  end loop;
end;
$$;

revoke execute on function public.phishguard_org_id() from public, anon;
grant execute on function public.phishguard_org_id() to authenticated, service_role;

do $$
declare
  t record;
  accion text;
  rol text;
  permitido boolean;
begin
  for t in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    foreach rol in array array['anon', 'authenticated'] loop
      execute format('revoke truncate, references, trigger on table public.%I from %I', t.relname, rol);
      foreach accion in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
        select exists (
          select 1 from pg_policies p
          where p.schemaname = 'public' and p.tablename = t.relname
            and (p.cmd = accion or p.cmd = 'ALL')
            and (rol = any (p.roles) or 'public' = any (p.roles))
        ) into permitido;
        if not permitido then
          execute format('revoke %s on table public.%I from %I', accion, t.relname, rol);
        end if;
      end loop;
    end loop;
  end loop;
end;
$$;
