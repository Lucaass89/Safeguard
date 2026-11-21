-- Datos de la empresa de PhishGuard: nombre, tipo, CUIT, responsable y áreas.
-- Se cargan en el formulario de compra y se editan desde el panel.
-- La validación del servidor vive acá y la usan el panel y la función de cobro.
-- Cierra además la escritura directa sobre organizaciones: antes un usuario de la
-- organización podía cambiar cualquier columna, incluida la cantidad contratada.

alter table public.organizaciones
  add column if not exists tipo_organizacion text,
  add column if not exists cuit text,
  add column if not exists contacto_nombre text,
  add column if not exists contacto_cargo text,
  add column if not exists contacto_email text,
  add column if not exists contacto_telefono text;

alter table public.organizaciones
  drop constraint if exists organizaciones_tipo_organizacion_check;

alter table public.organizaciones
  add constraint organizaciones_tipo_organizacion_check
  check (tipo_organizacion is null or tipo_organizacion in ('pyme', 'educativa'));

alter table public.organizaciones
  drop constraint if exists organizaciones_cuit_check;

alter table public.organizaciones
  add constraint organizaciones_cuit_check
  check (cuit is null or cuit ~ '^[0-9]{11}$');

revoke insert, update, delete, truncate on table public.organizaciones from anon, authenticated;

create table if not exists public.areas_empresa (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  creado_en timestamptz not null default now()
);

create unique index if not exists areas_empresa_org_nombre_key
  on public.areas_empresa (organizacion_id, lower(nombre));

alter table public.areas_empresa enable row level security;

revoke all on table public.areas_empresa from anon, authenticated;
grant select on table public.areas_empresa to authenticated;
grant all on table public.areas_empresa to service_role;

drop policy if exists areas_empresa_select on public.areas_empresa;

create policy areas_empresa_select on public.areas_empresa
  for select to authenticated
  using (organizacion_id = public.phishguard_org_id());

create table if not exists public.phishguard_solicitudes (
  auth_user_id uuid primary key,
  datos jsonb not null,
  actualizado_en timestamptz not null default now()
);

alter table public.phishguard_solicitudes enable row level security;

revoke all on table public.phishguard_solicitudes from public, anon, authenticated;
grant all on table public.phishguard_solicitudes to service_role;

create or replace function public.phishguard_cuit_valido(p_cuit text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_pesos integer[] := array[5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  v_suma integer := 0;
  v_verificador integer;
begin
  if p_cuit is null or p_cuit !~ '^[0-9]{11}$' then
    return false;
  end if;
  if left(p_cuit, 2) not in ('20', '23', '24', '25', '26', '27', '30', '33', '34') then
    return false;
  end if;
  for i in 1..10 loop
    v_suma := v_suma + v_pesos[i] * substr(p_cuit, i, 1)::integer;
  end loop;
  v_verificador := 11 - (v_suma % 11);
  if v_verificador = 11 then
    v_verificador := 0;
  end if;
  if v_verificador = 10 then
    return false;
  end if;
  return v_verificador = substr(p_cuit, 11, 1)::integer;
end;
$$;

create or replace function public.phishguard_empresa_normalizada(p_datos jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_nombre text := btrim(regexp_replace(coalesce(p_datos->>'nombre_empresa', ''), '\s+', ' ', 'g'));
  v_tipo text := btrim(coalesce(p_datos->>'tipo_organizacion', ''));
  v_cuit text := regexp_replace(coalesce(p_datos->>'cuit', ''), '\D', '', 'g');
  v_contacto text := btrim(regexp_replace(coalesce(p_datos->>'contacto_nombre', ''), '\s+', ' ', 'g'));
  v_cargo text := btrim(regexp_replace(coalesce(p_datos->>'contacto_cargo', ''), '\s+', ' ', 'g'));
  v_email text := regexp_replace(lower(btrim(coalesce(p_datos->>'contacto_email', ''))), '\s', '', 'g');
  v_telefono text := btrim(regexp_replace(coalesce(p_datos->>'contacto_telefono', ''), '\s+', ' ', 'g'));
  v_areas jsonb := '[]'::jsonb;
  v_area text;
  v_vistas text[] := array[]::text[];
begin
  if p_datos is null or jsonb_typeof(p_datos) <> 'object' then
    raise exception 'Faltan los datos de la empresa.';
  end if;
  if char_length(v_nombre) not between 2 and 120 or v_nombre ~ '^[=+\-@]' then
    raise exception 'Escribí el nombre de la empresa, de 2 a 120 caracteres.';
  end if;
  if v_tipo not in ('pyme', 'educativa') then
    raise exception 'Elegí si es una PyME o una institución educativa.';
  end if;
  if v_cuit <> '' and not public.phishguard_cuit_valido(v_cuit) then
    raise exception 'El CUIT no es válido. Revisá los 11 números.';
  end if;
  if char_length(v_contacto) not between 2 and 120 or v_contacto ~ '^[=+\-@]' then
    raise exception 'Escribí el nombre de quien representa a la empresa.';
  end if;
  if char_length(v_cargo) > 80 or v_cargo ~ '^[=+\-@]' then
    raise exception 'El cargo puede tener hasta 80 caracteres y no puede empezar con =, +, - o @.';
  end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(v_email) > 320 then
    raise exception 'Escribí un correo válido, por ejemplo nombre@empresa.com.';
  end if;
  if v_telefono <> '' and v_telefono !~ '^[0-9+()\- ]{6,25}$' then
    raise exception 'El teléfono solo puede tener números, espacios, +, - y paréntesis.';
  end if;

  if p_datos ? 'areas' and jsonb_typeof(p_datos->'areas') = 'array' then
    for v_area in select btrim(regexp_replace(value, '\s+', ' ', 'g')) from jsonb_array_elements_text(p_datos->'areas') loop
      continue when v_area = '' or lower(v_area) = any(v_vistas);
      if char_length(v_area) > 60 or v_area ~ '^[=+\-@]' then
        raise exception 'Cada área puede tener hasta 60 caracteres y no puede empezar con =, +, - o @.';
      end if;
      v_vistas := v_vistas || lower(v_area);
      v_areas := v_areas || to_jsonb(v_area);
    end loop;
  end if;
  if jsonb_array_length(v_areas) > 30 then
    raise exception 'Podés cargar hasta 30 áreas.';
  end if;

  return jsonb_build_object(
    'nombre_empresa', v_nombre,
    'tipo_organizacion', v_tipo,
    'cuit', nullif(v_cuit, ''),
    'contacto_nombre', v_contacto,
    'contacto_cargo', nullif(v_cargo, ''),
    'contacto_email', v_email,
    'contacto_telefono', nullif(v_telefono, ''),
    'areas', v_areas
  );
end;
$$;

create or replace function public.phishguard_aplicar_empresa(p_org uuid, p_datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v jsonb := public.phishguard_empresa_normalizada(p_datos);
begin
  update public.organizaciones
     set nombre_empresa = v->>'nombre_empresa',
         tipo_organizacion = v->>'tipo_organizacion',
         cuit = v->>'cuit',
         contacto_nombre = v->>'contacto_nombre',
         contacto_cargo = v->>'contacto_cargo',
         contacto_email = v->>'contacto_email',
         contacto_telefono = v->>'contacto_telefono'
   where id = p_org;

  if not found then
    raise exception 'No hay empresa';
  end if;

  delete from public.areas_empresa a
   where a.organizacion_id = p_org
     and not exists (
       select 1 from jsonb_array_elements_text(v->'areas') n(nombre)
       where lower(n.nombre) = lower(a.nombre)
     );

  insert into public.areas_empresa (organizacion_id, nombre)
  select p_org, n.nombre
    from jsonb_array_elements_text(v->'areas') n(nombre)
  on conflict (organizacion_id, lower(nombre)) do nothing;

  return v;
end;
$$;

create or replace function public.phishguard_guardar_empresa(p_datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := public.phishguard_org_id();
  v_rol text;
begin
  if v_org is null then
    raise exception 'No hay empresa';
  end if;

  select ua.rol into v_rol
  from public.usuarios_admin ua
  where ua.auth_user_id = auth.uid();

  if v_rol is null or v_rol not ilike 'admin%' then
    raise exception 'Solo un administrador de la empresa puede cambiar sus datos.';
  end if;

  return public.phishguard_aplicar_empresa(v_org, p_datos);
end;
$$;

revoke all on function public.phishguard_cuit_valido(text) from public;
revoke all on function public.phishguard_empresa_normalizada(jsonb) from public;
revoke all on function public.phishguard_aplicar_empresa(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.phishguard_guardar_empresa(jsonb) from public, anon;

grant execute on function public.phishguard_cuit_valido(text) to anon, authenticated, service_role;
grant execute on function public.phishguard_empresa_normalizada(jsonb) to authenticated, service_role;
grant execute on function public.phishguard_aplicar_empresa(uuid, jsonb) to service_role;
grant execute on function public.phishguard_guardar_empresa(jsonb) to authenticated;
