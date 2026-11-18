-- Perfil de la app: cuántos celulares tienen avisos y "Cuidar a un familiar".
-- Un familiar (cuidado) genera un código de 6 letras que vence a los 30 minutos; quien lo cuida (cuidador) lo escribe
-- en su app y quedan vinculados. Si el cuidado guarda un análisis rojo, familia-avisar le manda un aviso al celular
-- del cuidador con el dominio. Cualquiera de los dos puede quitar el vínculo. Las tablas no se leen desde el navegador:
-- todo pasa por estas funciones.

create or replace function public.push_mis_dispositivos()
returns table (cantidad integer, ultimo timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select count(*)::integer, max(actualizado)
  from public.push_dispositivos
  where usuario_id = auth.uid();
$$;

create or replace function public.push_borrar_otros(p_token text)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_borrados integer;
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  delete from public.push_dispositivos
  where usuario_id = auth.uid() and token <> coalesce(p_token, '');
  get diagnostics v_borrados = row_count;
  return v_borrados;
end;
$$;

create table if not exists public.familia_invitaciones (
  codigo text primary key check (codigo ~ '^[A-Z2-9]{6}$'),
  cuidado_id uuid not null references auth.users (id) on delete cascade,
  vence timestamptz not null,
  creado timestamptz not null default now()
);

create index if not exists familia_invitaciones_cuidado on public.familia_invitaciones (cuidado_id);

create table if not exists public.familia_vinculos (
  cuidador_id uuid not null references auth.users (id) on delete cascade,
  cuidado_id uuid not null references auth.users (id) on delete cascade,
  creado timestamptz not null default now(),
  ultimo_aviso timestamptz,
  primary key (cuidador_id, cuidado_id),
  check (cuidador_id <> cuidado_id)
);

create index if not exists familia_vinculos_cuidado on public.familia_vinculos (cuidado_id);

alter table public.familia_invitaciones enable row level security;
alter table public.familia_vinculos enable row level security;
revoke all on public.familia_invitaciones from anon, authenticated;
revoke all on public.familia_vinculos from anon, authenticated;

create or replace function public.familia_nombre(p_usuario uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(u.email, '@', 1)
  )
  from auth.users u
  where u.id = p_usuario;
$$;

revoke all on function public.familia_nombre(uuid) from public, anon, authenticated;
grant execute on function public.familia_nombre(uuid) to service_role;

create or replace function public.familia_crear_codigo()
returns table (codigo text, vence timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_codigo text;
  v_bytes bytea;
  v_intento integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  if (select count(*) from public.familia_vinculos where cuidado_id = auth.uid()) >= 5 then
    raise exception 'Ya tenés 5 personas que te cuidan';
  end if;

  delete from public.familia_invitaciones where cuidado_id = auth.uid() or familia_invitaciones.vence < now();

  loop
    v_intento := v_intento + 1;
    v_bytes := extensions.gen_random_bytes(6);
    v_codigo := '';
    for i in 0..5 loop
      v_codigo := v_codigo || substr(v_alfabeto, (get_byte(v_bytes, i) % length(v_alfabeto)) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.familia_invitaciones f where f.codigo = v_codigo) or v_intento > 5;
  end loop;

  insert into public.familia_invitaciones (codigo, cuidado_id, vence)
  values (v_codigo, auth.uid(), now() + interval '30 minutes');

  return query select v_codigo, now() + interval '30 minutes';
end;
$$;

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

create or replace function public.familia_mis_vinculos()
returns table (rol text, otro_id uuid, nombre text, desde timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select 'cuido', v.cuidado_id, public.familia_nombre(v.cuidado_id), v.creado
  from public.familia_vinculos v
  where v.cuidador_id = auth.uid()
  union all
  select 'me_cuida', v.cuidador_id, public.familia_nombre(v.cuidador_id), v.creado
  from public.familia_vinculos v
  where v.cuidado_id = auth.uid()
  order by 4;
$$;

create or replace function public.familia_quitar(p_otro uuid)
returns void
language sql
security definer
set search_path to 'public'
as $$
  delete from public.familia_vinculos
  where (cuidador_id = auth.uid() and cuidado_id = p_otro)
     or (cuidado_id = auth.uid() and cuidador_id = p_otro);
$$;

revoke all on function public.push_mis_dispositivos() from public, anon;
revoke all on function public.push_borrar_otros(text) from public, anon;
revoke all on function public.familia_crear_codigo() from public, anon;
revoke all on function public.familia_aceptar(text) from public, anon;
revoke all on function public.familia_mis_vinculos() from public, anon;
revoke all on function public.familia_quitar(uuid) from public, anon;
grant execute on function public.push_mis_dispositivos() to authenticated;
grant execute on function public.push_borrar_otros(text) to authenticated;
grant execute on function public.familia_crear_codigo() to authenticated;
grant execute on function public.familia_aceptar(text) to authenticated;
grant execute on function public.familia_mis_vinculos() to authenticated;
grant execute on function public.familia_quitar(uuid) to authenticated;
